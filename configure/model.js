/* Static prototype adapter and workflow. No terminal or backend API is called. */
(function (root) {
  'use strict';
  const SN = 'WP6170PQ23000060';
  const normalizeTci = value => String(value).trim().toUpperCase().replace(/^TC\s*/, '').replace(/\s/g, '');
  const validTci = value => /^\d{8}$/.test(normalizeTci(value));
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
      this.record = { scenario: 'unbound', binding: null, installed: {}, results: null, consumed: {}, reads: { apps: 0, parameters: 0 } };
      try {
        const saved = JSON.parse(storage?.getItem('paywizard-configure-v2') || 'null');
        if (saved && saved.version === 2) this.record = saved.record;
      } catch (_) { /* Storage unavailable: keep the demo in memory. */ }
    }
    persist() {
      try { this.storage?.setItem('paywizard-configure-v2', JSON.stringify({ version: 2, record: this.record })); } catch (_) { /* In-memory fallback. */ }
    }
    reset(scenario) {
      this.record = { scenario, binding: ['bound', 'swap', 'app-failure', 'parameter-failure'].includes(scenario) ? (scenario === 'swap' ? 'TC00004321' : 'TC12345678') : null, installed: {}, results: null, consumed: {}, reads: { apps: 0, parameters: 0 } };
      this.persist();
    }
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
    async manifest(type) {
      await this.wait(350);
      this.record.reads[type]++;
      this.persist();
      return type === 'apps' ? [
        { id: 'paywizard-app', name: 'Paywizard APP', version: '2.9.1' },
        { id: 'payment-app', name: 'Paywizard TSYS', version: '1.2.8' }
      ] : [
        { id: 'paywizard-parameters', name: 'Paywizard APP parameters', version: '' },
        { id: 'payment-parameters', name: 'Paywizard TSYS parameters', version: '' }
      ];
    }
    shouldFail(type, item, index) {
      const scenario = this.record.scenario;
      const active = type === 'apps' ? ['swap', 'app-failure'].includes(scenario) : scenario === 'parameter-failure';
      if (active && item.id.startsWith('payment-') && index === 2 && !this.record.consumed[type]) {
        this.record.consumed[type] = true;
        this.persist();
        return true;
      }
      return false;
    }
    checkpoint(state) {
      if (state.tci) this.record.results = { tci: state.tci, apps: clone(state.apps), parameters: clone(state.parameters), pendingParameters: state.pendingParameters };
      this.persist();
    }
  }

  class Configuration {
    constructor(gateway, onChange = () => {}) {
      this.gateway = gateway;
      this.onChange = onChange;
      this.generation = 0;
      this.state = { binding: 'loading', tci: '', busy: false, message: '', error: '', apps: [], parameters: [], pendingParameters: false, closed: false };
    }
    emit() { this.gateway.checkpoint(this.state); this.onChange(this.state); }
    current(token) { return token === this.generation && !this.state.closed; }
    get complete() { return this.state.parameters.length > 0 && this.state.parameters.every(item => item.status === 'success'); }
    get failures() { return [...this.state.apps, ...this.state.parameters].some(item => item.status === 'error'); }
    async enter() {
      const token = ++this.generation;
      Object.assign(this.state, { binding: 'loading', tci: '', busy: false, message: 'Checking this terminal…', error: '', apps: [], parameters: [], pendingParameters: false, closed: false });
      this.onChange(this.state);
      try {
        const tci = await this.gateway.lookup();
        if (!this.current(token)) return;
        const saved = this.gateway.record.results;
        Object.assign(this.state, { binding: tci ? 'bound' : 'unbound', tci: tci || '', message: '' });
        if (tci && saved?.tci === tci) {
          this.state.apps = clone(saved.apps);
          this.state.parameters = clone(saved.parameters);
          this.state.pendingParameters = saved.pendingParameters;
          for (const item of [...this.state.apps, ...this.state.parameters]) {
            if (['working', 'queued'].includes(item.status)) Object.assign(item, { status: 'error', phase: 'Interrupted. Retry to continue.' });
          }
        }
      } catch (error) {
        if (!this.current(token)) return;
        Object.assign(this.state, { binding: 'error', message: error.message });
      }
      this.emit();
    }
    async start(operation, input = '') {
      if (this.state.busy || this.state.closed || !['bound', 'unbound'].includes(this.state.binding)) return;
      if (operation !== 'setup' && this.state.binding !== 'bound') return;
      if (this.state.binding === 'unbound' && !validTci(input)) {
        this.state.error = 'Enter 8 digits after TC.';
        this.emit(); return;
      }
      const token = ++this.generation;
      Object.assign(this.state, { busy: true, error: '', message: this.state.tci ? 'Checking applications…' : 'Checking TCI…' });
      this.emit();
      try {
        if (!this.state.tci) {
          const tci = await this.gateway.bind('TC' + normalizeTci(input));
          if (!this.current(token)) return;
          Object.assign(this.state, { tci, binding: 'bound' });
          this.emit();
        }
        const manifest = await this.gateway.manifest('apps');
        if (!this.current(token)) return;
        this.state.apps = manifest.map(item => {
          const next = task(item);
          if (this.gateway.record.installed[item.id] === item.version) Object.assign(next, { progress: 100, phase: 'Installed', status: 'success' });
          return next;
        });
        this.state.pendingParameters = operation !== 'apps';
        // A new parameter request invalidates the previous Applied result immediately.
        if (operation !== 'apps') this.state.parameters = [];
        this.state.message = '';
        this.emit();
        await this.run('apps', this.state.apps.filter(item => item.status !== 'success'), token);
        if (!this.current(token)) return;
        if (!this.state.apps.some(item => item.status === 'error') && this.state.pendingParameters) await this.beginParameters(token);
      } catch (error) {
        if (this.current(token)) this.state.error = error.message;
      } finally {
        if (this.current(token)) { this.state.busy = false; this.state.message = ''; this.emit(); }
      }
    }
    async beginParameters(token) {
      this.state.message = 'Checking latest parameters…'; this.emit();
      const manifest = await this.gateway.manifest('parameters');
      if (!this.current(token)) return;
      this.state.parameters = manifest.map(task);
      this.state.pendingParameters = false;
      this.state.message = ''; this.emit();
      await this.run('parameters', this.state.parameters, token);
    }
    async run(type, items, token) {
      await Promise.all(items.map(async item => {
        if (!this.current(token)) return;
        Object.assign(item, { status: 'working', phase: phases[type][0][0], progress: 0 }); this.emit();
        for (let index = 0; index < phases[type].length; index++) {
          await this.gateway.wait(item.id.startsWith('payment-') ? 850 : 650);
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
      this.state.busy = true; this.state.error = ''; this.emit();
      try {
        await this.run(type, [item], token);
        if (!this.current(token)) return;
        if (type === 'apps' && this.state.pendingParameters && this.state.apps.every(entry => entry.status === 'success')) await this.beginParameters(token);
      } catch (error) { if (this.current(token)) this.state.error = error.message; }
      finally { if (this.current(token)) { this.state.busy = false; this.state.message = ''; this.emit(); } }
    }
    close() {
      ++this.generation;
      for (const item of [...this.state.apps, ...this.state.parameters]) {
        if (['working', 'queued'].includes(item.status)) Object.assign(item, { status: 'error', phase: 'Interrupted. Retry to continue.' });
      }
      this.state.busy = false; this.state.closed = true; this.emit();
    }
  }
  const api = { SN, normalizeTci, validTci, DemoGateway, Configuration };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ConfigureModel = api;
})(globalThis);
