/* Static prototype adapter and workflow. No terminal or backend API is called. */
(function (root) {
  'use strict';
  const SN = 'WP6170PQ23000060';
  const STALL_AFTER_MS = 120000;
  const normalizeTci = value => String(value).trim().toUpperCase().replace(/^TC\s*/, '').replace(/\s/g, '');
  const validTci = value => /^\d{8}$/.test(normalizeTci(value));
  // Demo dotted versions only; a real Android adapter must compare package versionCode.
  const compareVersions = (left, right) => {
    if (![left, right].every(value => /^\d+(?:\.\d+)*$/.test(value))) throw new Error('Couldn’t compare application versions. Try again.');
    const a = left.split('.').map(Number), b = right.split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const difference = (a[i] || 0) - (b[i] || 0);
      if (difference) return Math.sign(difference);
    }
    return 0;
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const phases = {
    apps: [['Checking package', 5], ['Downloading', 28], ['Downloading', 64], ['Verifying', 80], ['Installing', 92], ['Installed', 100]],
    parameters: [['Connecting', 5], ['Downloading', 32], ['Downloading', 64], ['Validating', 80], ['Applying', 92], ['Applied', 100]]
  };
  const task = item => ({ ...item, progress: 0, phase: 'Waiting', status: 'queued' });

  class DemoGateway {
    constructor({ wait = ms => new Promise(resolve => setTimeout(resolve, ms)), storage = null } = {}) {
      this.wait = wait;
      this.storage = storage;
      this.record = { scenario: 'unbound', binding: null, installed: {}, jobs: {}, setupScope: null, bindingRevision: 1, consumed: {}, reads: { apps: 0, parameters: 0 } };
      try {
        const saved = JSON.parse(storage?.getItem('paywizard-configure-v3') || 'null');
        if (saved && saved.version === 3) this.record = saved.record;
      } catch (_) { /* Storage unavailable: keep the demo in memory. */ }
    }
    persist() {
      try { this.storage?.setItem('paywizard-configure-v3', JSON.stringify({ version: 3, record: this.record })); } catch (_) { /* In-memory fallback. */ }
    }
    reset(scenario) {
      this.record = { scenario, binding: ['bound', 'configured', 'maintenance-failure', 'apps-outdated', 'app-uninstalled', 'inventory-failure', 'swap', 'app-failure', 'parameter-failure', 'stalled-setup', 'stalled-apps', 'stalled-parameters'].includes(scenario) ? (scenario === 'swap' ? 'TC00004321' : 'TC12345678') : null, installed: {}, jobs: {}, setupScope: null, bindingRevision: 1, consumed: {}, reads: { apps: 0, parameters: 0 } };
      if (['configured', 'maintenance-failure', 'apps-outdated', 'app-uninstalled', 'inventory-failure', 'stalled-apps', 'stalled-parameters'].includes(scenario)) {
        this.record.setupScope = this.scope;
        this.record.installed = { 'paywizard-app': '2.9.1', 'payment-app': '1.2.8' };
      }
      if (scenario === 'apps-outdated') this.record.installed['paywizard-app'] = '2.8.0';
      if (['app-uninstalled', 'stalled-apps'].includes(scenario)) delete this.record.installed['payment-app'];
      this.persist();
    }
    get scope() { return this.record.binding ? this.record.binding + ':' + this.record.bindingRevision : null; }
    async lookup() {
      await this.wait(600);
      if (this.record.scenario === 'query-failure') throw new Error('Couldn’t check this terminal. Check the connection and try again.');
      return this.record.binding;
    }
    async bind(tci) {
      await this.wait(500);
      const errors = {
        TC00009999: 'This TCI is already bound to another terminal.',
        TC00000000: 'This TCI was not found. Check the number and try again.',
        TC00008888: 'Assign this TCI to a store in Portal / Maintain first.',
        TC00007777: 'This terminal is not authorized to use this TCI.'
      };
      if (errors[tci]) throw new Error(errors[tci]);
      if (this.record.binding && this.record.binding !== tci) throw new Error('The binding has changed. Reopen the app to check this terminal.');
      this.record.binding = tci;
      this.persist();
      return tci;
    }
    async installedApplications() {
      await this.wait(350);
      if (this.record.scenario === 'inventory-failure') throw new Error('Couldn’t check installed applications. Try again.');
      // Simulated system inventory, independent of saved task receipts.
      return clone(this.record.installed);
    }
    async manifest(type) {
      await this.wait(350);
      this.record.reads[type]++;
      this.persist();
      return type === 'apps' ? [
        { id: 'paywizard-app', name: 'Paywizard APP', version: '2.9.1' },
        { id: 'payment-app', name: 'Paywizard TSYS', version: '1.2.8' }
      ] : [
        { id: 'paywizard-parameters', appId: 'paywizard-app', name: 'Paywizard APP parameters', version: '' },
        { id: 'payment-parameters', appId: 'payment-app', name: 'Paywizard TSYS parameters', version: '' }
      ];
    }
    shouldFail(type, item, index) {
      const scenario = this.record.scenario;
      const active = type === 'apps' ? ['swap', 'app-failure'].includes(scenario) : ['parameter-failure', 'maintenance-failure'].includes(scenario);
      if (active && item.id.startsWith('payment-') && index === 2 && !this.record.consumed[type]) {
        this.record.consumed[type] = true;
        this.persist();
        return true;
      }
      return false;
    }
    async taskSnapshot(operation) {
      // Demo receipts only. A real adapter must query the terminal's live job.
      await this.wait(350);
      return clone(this.record.jobs[operation] || null);
    }
    checkpoint(state) {
      if (state.operation && state.scope === this.scope && state.taskStatus !== 'unknown') {
        this.record.jobs[state.operation] = { scope: state.scope, apps: clone(state.apps), parameters: clone(state.parameters), stage: state.stage, status: state.taskStatus, error: state.error };
        if (state.initialSetupCompleted) this.record.setupScope = state.scope;
      }
      this.persist();
    }
  }

  class Configuration {
    constructor(gateway, onChange = () => {}, { now = () => performance.now() } = {}) {
      this.gateway = gateway;
      this.onChange = onChange;
      this.generation = 0;
      this.state = {};
      this.now = now;
      this.lastProgressAt = null;
      this.progressSignature = null;
    }
    updateStall() {
      if (!this.state.busy || !this.state.operation || this.state.closed) {
        this.lastProgressAt = null;
        this.progressSignature = null;
        this.state.stalled = false;
        return;
      }
      // Navigation, repeated notifications and polling are not progress.
      const signature = JSON.stringify([this.state.stage, this.state.taskStatus,
        ...['apps', 'parameters'].map(type => this.state[type].map(item =>
          [item.id, item.phase, item.progress, item.status, item.bytesDownloaded]))]);
      if (signature !== this.progressSignature) {
        this.progressSignature = signature;
        this.lastProgressAt = this.now();
      }
      this.state.stalled = this.now() - this.lastProgressAt >= STALL_AFTER_MS;
    }
    checkStall() {
      const wasStalled = this.state.stalled;
      this.updateStall();
      if (wasStalled !== this.state.stalled) this.onChange(this.state);
    }
    emit() { this.updateStall(); this.gateway.checkpoint(this.state); this.onChange(this.state); }
    current(token) { return token === this.generation && !this.state.closed; }
    get complete() { return Boolean(this.state.initialSetupCompleted); }
    get failures() { return [...this.state.apps, ...this.state.parameters].some(item => item.status === 'error'); }
    pending(operation) {
      const job = this.gateway.record.jobs[operation];
      return job?.scope === this.state.scope && job.status !== 'success' ? job : null;
    }
    async enter() {
      if (this.state.busy && !this.state.closed) return;
      const token = ++this.generation;
      this.lastProgressAt = null; this.progressSignature = null;
      Object.assign(this.state, { binding: 'loading', scope: null, tci: '', busy: false, stalled: false, checkingTask: false, message: 'Checking this terminal…', error: '', apps: [], parameters: [], closed: false, page: 'home', operation: null, stage: '', taskStatus: '', initialSetupCompleted: false });
      this.onChange(this.state);
      try {
        const tci = await this.gateway.lookup();
        if (!this.current(token)) return;
        const scope = this.gateway.scope;
        Object.assign(this.state, { binding: tci ? 'bound' : 'unbound', scope, tci: tci || '', message: '', initialSetupCompleted: Boolean(scope && this.gateway.record.setupScope === scope) });
        // An unconfirmed saved run must not become retryable just because the UI reopened.
        const unresolved = Object.entries(this.gateway.record.jobs).find(([, job]) =>
          job.scope === scope && ['running', 'unknown'].includes(job.status));
        if (unresolved) {
          const [operation, job] = unresolved;
          Object.assign(this.state, { operation, apps: clone(job.apps), parameters: clone(job.parameters), stage: job.stage,
            busy: true, taskStatus: 'unknown', message: 'Task status is not confirmed. Check again before starting another task.' });
        }
      } catch (error) {
        if (!this.current(token)) return;
        Object.assign(this.state, { binding: 'error', message: error.message });
      }
      this.emit();
    }
    goHome() {
      this.updateStall();
      if (this.state.closed || (this.state.busy && !this.state.stalled)) return false;
      this.state.page = 'home'; this.emit(); return true;
    }
    viewTask(operation) {
      if (this.state.closed || !this.state.busy || this.state.operation !== operation) return false;
      this.state.page = 'task'; this.emit();
      if (this.state.taskStatus === 'unknown') this.checkTaskStatus();
      return true;
    }
    async checkTaskStatus() {
      if (this.state.closed || this.state.taskStatus !== 'unknown' || this.state.checkingTask) return;
      const token = this.generation;
      this.state.checkingTask = true; this.emit();
      try {
        const job = await this.gateway.taskSnapshot(this.state.operation);
        if (!this.current(token)) return;
        if (job?.scope === this.state.scope && ['success', 'failed'].includes(job.status)) {
          Object.assign(this.state, { apps: clone(job.apps), parameters: clone(job.parameters), stage: job.stage,
            taskStatus: job.status, busy: false, error: job.error || '', message: '' });
          if (this.state.operation === 'setup' && job.status === 'success') this.state.initialSetupCompleted = true;
        } else if (job?.scope === this.state.scope && ['running', 'unknown'].includes(job.status)) {
          Object.assign(this.state, { apps: clone(job.apps), parameters: clone(job.parameters), stage: job.stage });
        }
      } catch (_) { /* Unavailable status is not evidence of cancellation or failure. */ }
      finally {
        if (this.current(token)) { this.state.checkingTask = false; this.emit(); }
      }
    }
    async start(operation, input = '') {
      if (this.state.busy) { this.viewTask(operation); return; }
      if (!['setup', 'apps', 'parameters'].includes(operation) || this.state.busy || this.state.closed || !['bound', 'unbound'].includes(this.state.binding)) return;
      if (operation !== 'setup' && !this.complete) return;
      if (operation === 'setup' && this.complete) return;
      if (this.state.binding === 'unbound' && !validTci(input)) {
        this.state.error = 'Enter 8 digits after TC.'; this.emit(); return;
      }
      const token = ++this.generation;
      this.progressSignature = null;
      this.state.busy = true; this.state.error = ''; this.state.message = 'Checking TCI…'; this.emit();
      try {
        if (!this.state.tci) {
          const tci = await this.gateway.bind('TC' + normalizeTci(input));
          if (!this.current(token)) return;
          Object.assign(this.state, { tci, scope: this.gateway.scope, binding: 'bound' });
        }
        const saved = this.pending(operation);
        Object.assign(this.state, { page: 'task', operation, apps: saved ? clone(saved.apps) : [], parameters: saved ? clone(saved.parameters) : [], stage: 'appManifest', taskStatus: 'running', message: '' });
        this.emit();
        await this.pipeline(token);
      } catch (error) { if (this.current(token)) this.state.error = error.message; }
      finally { this.finish(token); }
    }
    async pipeline(token, retry = null) {
      if (this.state.stage === 'appManifest') {
        this.state.message = this.state.operation === 'parameters' ? 'Checking installed applications…' : 'Checking applications and versions…'; this.emit();
        const manifest = await this.gateway.manifest('apps');
        if (!this.current(token)) return;
        const installed = await this.gateway.installedApplications();
        if (!this.current(token)) return;
        const previous = this.state.apps;
        this.state.apps = manifest.map(item => {
          const version = installed[item.id];
          const comparison = version && this.state.operation !== 'parameters' ? compareVersions(version, item.version) : 0;
          const present = Boolean(version) && (this.state.operation === 'parameters' || comparison >= 0);
          const old = previous.find(entry => entry.id === item.id);
          if (present) {
            // Preserve this task's successful delivery only when the system still confirms it.
            if (old?.status === 'success' && old.delivery && old.version === version) return old;
            return { ...item, version, progress: 100, phase: this.state.operation === 'parameters' ? 'Installed' : comparison > 0 ? 'Newer version installed' : 'Up to date', status: 'success', delivery: false };
          }
          // Reinstallation invalidates that app's prior parameter application result.
          // Older demo receipts without an app association must be reapplied conservatively.
          this.state.parameters = this.state.parameters.map(parameter => !parameter.appId || parameter.appId === item.id ? task(parameter) : parameter);
          if (old?.status === 'error' && old.version === item.version) return { ...old, delivery: true };
          return { ...task(item), delivery: true, installedVersion: version || null };
        });
        this.state.stage = 'apps'; this.state.message = ''; this.emit();
      }
      if (this.state.stage === 'apps') {
        const work = this.state.apps.filter(item => item.status !== 'success' && (retry?.type !== 'apps' || item.id === retry.id || item.status === 'queued'));
        await this.run('apps', work, token);
        if (!this.current(token) || this.state.apps.some(item => item.status !== 'success')) return;
        this.state.stage = this.state.operation === 'apps' ? 'done' : this.state.parameters.length ? 'parameters' : 'parameterManifest'; this.emit();
      }
      if (this.state.stage === 'parameterManifest') {
        this.state.message = 'Checking latest parameters…'; this.emit();
        const manifest = await this.gateway.manifest('parameters');
        if (!this.current(token)) return;
        this.state.parameters = manifest.map(task);
        this.state.stage = 'parameters'; this.state.message = ''; this.emit();
      }
      if (this.state.stage === 'parameters') {
        const work = this.state.parameters.filter(item => item.status !== 'success' && (retry?.type !== 'parameters' || item.id === retry.id || item.status === 'queued'));
        await this.run('parameters', work, token);
        if (!this.current(token) || this.failures) return;
        this.state.stage = 'done';
      }
    }
    finish(token) {
      if (!this.current(token)) return;
      this.state.busy = false; this.state.message = '';
      if (this.state.operation) {
        this.state.taskStatus = this.state.stage === 'done' && !this.state.error ? 'success' : 'failed';
        if (this.state.operation === 'setup' && this.state.taskStatus === 'success') this.state.initialSetupCompleted = true;
      }
      this.emit();
    }
    async run(type, items, token) {
      await Promise.all(items.map(async item => {
        if (!this.current(token)) return;
        Object.assign(item, { status: 'working', phase: phases[type][0][0], progress: 0 }); this.emit();
        for (let index = 0; index < phases[type].length; index++) {
          const stallDemo = this.gateway.record.scenario === 'stalled-' + this.state.operation && (this.state.operation !== 'setup' || type === 'apps');
          await this.gateway.wait(stallDemo && index === 2 ? 180000 : item.id.startsWith('payment-') ? 850 : 650);
          if (!this.current(token)) return;
          if (this.gateway.shouldFail(type, item, index)) {
            Object.assign(item, { status: 'error', phase: 'Connection lost. Check the network and retry.' }); this.emit(); return;
          }
          const [phase, progress] = phases[type][index];
          Object.assign(item, { phase, progress, status: progress === 100 ? 'success' : 'working' });
          if (type === 'apps' && progress === 100) this.gateway.record.installed[item.id] = item.version;
          this.emit();
        }
      }));
    }
    async retry(type, id) {
      const item = this.state[type]?.find(entry => entry.id === id);
      if (!item || item.status !== 'error' || this.state.busy || this.state.closed || this.state.binding !== 'bound') return;
      const token = ++this.generation;
      this.progressSignature = null;
      this.state.busy = true; this.state.error = ''; this.state.taskStatus = 'running'; this.emit();
      try {
        this.state.stage = 'appManifest';
        await this.pipeline(token, { type, id });
      } catch (error) { if (this.current(token)) this.state.error = error.message; }
      finally { this.finish(token); }
    }
    close() {
      ++this.generation;
      // Only this in-memory simulator's owned run can be known to stop here.
      if (this.state.taskStatus !== 'unknown') {
        if (this.state.busy && this.state.operation) this.state.taskStatus = 'failed';
        for (const item of [...this.state.apps, ...this.state.parameters]) {
          if (['working', 'queued'].includes(item.status)) Object.assign(item, { status: 'error', phase: 'Interrupted. Retry to continue.' });
        }
      }
      this.state.busy = false; this.state.closed = true; this.emit();
    }
  }
  const api = { SN, STALL_AFTER_MS, normalizeTci, validTci, DemoGateway, Configuration, compareVersions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ConfigureModel = api;
})(globalThis);
