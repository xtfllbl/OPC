(function () {
    'use strict';
    const { DemoGateway, Configuration, normalizeTci } = window.ConfigureModel;
    const $ = id => document.getElementById(id);
    let storage = null;
    try { storage = window.sessionStorage; } catch (_) { /* File/private browsing fallback. */ }
    const gateway = new DemoGateway({ storage });
    const scenarios = ['unbound', 'bound', 'configured', 'maintenance-failure', 'apps-outdated', 'app-uninstalled', 'inventory-failure', 'swap', 'query-failure', 'app-failure', 'parameter-failure', 'stalled-setup', 'stalled-apps', 'stalled-parameters'];
    const requestedScenario = new URLSearchParams(location.search).get('scenario');
    if (scenarios.includes(requestedScenario)) gateway.reset(requestedScenario);
    const input = $('tcid-input');
    const rows = new Map();
    let lastAnnouncement = '';
    let titleHoldTimer;
    let controller;

    function renderTasks(type, listId, sectionId, items, busy) {
        const list = $(listId);
        $(sectionId).hidden = items.length === 0;
        for (const child of [...list.children]) {
            if (!items.some(item => item.id === child.dataset.taskId)) { rows.delete(child.dataset.taskId); child.remove(); }
        }
        for (const item of items) {
            let elements = rows.get(item.id);
            if (!elements) {
                const article = document.createElement('article');
                article.className = 'task-item'; article.dataset.taskId = item.id;
                article.innerHTML = '<div class="task-head"><span class="task-name"></span><span class="task-version"></span></div><div class="task-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="task-fill"></div></div><div class="task-meta"><span class="task-phase"></span><span class="task-percent"></span></div><button type="button" class="secondary-button task-retry" hidden>Retry</button>';
                const find = name => article.querySelector('.task-' + name);
                elements = { article, name: find('name'), version: find('version'), progress: find('progress'), fill: find('fill'), phase: find('phase'), percent: find('percent'), retry: find('retry') };
                elements.retry.addEventListener('click', async () => {
                    const restoreFocus = document.activeElement === elements.retry;
                    await controller.retry(type, item.id);
                    if (restoreFocus && elements.retry.hidden) { article.tabIndex = -1; article.focus({ preventScroll: true }); }
                });
                rows.set(item.id, elements); list.append(article);
            }
            elements.article.className = 'task-item ' + item.status;
            elements.name.textContent = item.name;
            elements.version.textContent = item.installedVersion && item.installedVersion !== item.version ? item.installedVersion + ' → ' + item.version : item.version;
            const checkOnly = type === 'apps' && item.delivery === false;
            elements.progress.hidden = checkOnly;
            elements.percent.hidden = checkOnly;
            elements.article.classList.toggle('check-only', checkOnly);
            elements.progress.setAttribute('aria-label', item.name + ' progress');
            elements.progress.setAttribute('aria-valuenow', item.progress);
            elements.progress.setAttribute('aria-valuetext', item.phase + ', ' + item.progress + '%');
            elements.fill.style.transform = 'scaleX(' + item.progress / 100 + ')';
            elements.phase.textContent = item.phase;
            elements.percent.textContent = item.progress + '%';
            elements.retry.hidden = item.status !== 'error';
            elements.retry.disabled = busy;
            elements.retry.setAttribute('aria-label', 'Retry ' + item.name);
        }
    }

    let previousPage = 'home';
    function render(state) {
        const bound = state.binding === 'bound';
        const taskPage = state.page === 'task';
        const home = !taskPage;
        const maintenance = controller.complete;
        const viewingSetup = home && state.busy && state.operation === 'setup';
        const changedPage = previousPage !== state.page;
        if (changedPage && taskPage) history.pushState({ configureTask: true }, '');
        previousPage = state.page;
        $('terminal-app').classList.toggle('task-page', taskPage);
        $('app-content').hidden = state.closed;
        $('exit-screen').hidden = !state.closed;
        const titles = { setup: 'Set up terminal', apps: 'Download apps', parameters: 'Update parameters' };
        if (taskPage) $('page-title').textContent = titles[state.operation];
        else if (maintenance) $('page-title').textContent = 'Your terminal';
        else $('page-title').innerHTML = 'Set up your<br>terminal';
        $('terminal-footer').hidden = taskPage;
        $('setup-form').hidden = taskPage;
        $('editable-tci').hidden = bound;
        $('bound-tci').hidden = !bound;
        $('tci-value').textContent = state.tci;
        input.disabled = state.binding !== 'unbound' || state.busy;
        input.readOnly = bound || state.busy;
        input.setAttribute('aria-invalid', String(Boolean(state.error && !bound)));
        input.closest('.input-wrap').classList.toggle('invalid', Boolean(state.error && !bound));
        $('setup-help').hidden = maintenance;
        $('tcid-error').textContent = state.error;
        $('tcid-error').hidden = !state.error || maintenance;
        $('binding-message').textContent = state.message;
        $('binding-message').hidden = !state.message || state.binding === 'loading' || state.busy;
        $('query-retry').hidden = state.binding !== 'error';
        $('setup-button').hidden = state.binding === 'error' || maintenance;
        $('setup-button').disabled = (state.busy && !viewingSetup) || !['bound', 'unbound'].includes(state.binding);
        $('setup-button').setAttribute('aria-busy', String((state.busy && !viewingSetup) || state.binding === 'loading'));
        $('setup-label').textContent = viewingSetup ? 'View progress' : state.binding === 'loading' ? 'Checking terminal…' : state.busy ? (state.message || 'Setting up…') : controller.pending('setup') ? 'Continue setup' : 'Set up terminal';
        $('setup-button').querySelector('.button-spinner').hidden = viewingSetup || (!state.busy && state.binding !== 'loading');
        $('setup-button').querySelector('.button-arrow').toggleAttribute('hidden', state.busy || state.binding === 'loading');
        $('results-area').hidden = home;
        $('app-results-title').textContent = state.operation === 'parameters' ? 'Application check' : 'Applications';
        renderTasks('apps', 'app-task-list', 'app-results', taskPage ? state.apps : [], state.busy);
        renderTasks('parameters', 'parameter-task-list', 'parameter-results', taskPage ? state.parameters : [], state.busy);
        $('task-status').textContent = state.busy ? (state.message || 'Keep this app open while the task runs.') : '';
        $('task-error').textContent = state.error;
        $('task-error').hidden = !state.error;
        $('task-retry').hidden = !taskPage || state.busy || !state.error;
        $('task-done').hidden = home || state.busy;
        $('task-stalled').hidden = home || !state.busy || !state.stalled;
        $('task-check-status').hidden = home || state.taskStatus !== 'unknown';
        $('task-check-status').disabled = state.checkingTask;
        $('task-check-status').textContent = state.checkingTask ? 'Checking…' : 'Check status';
        $('individual-actions').hidden = !home || !maintenance;
        $('download-app').disabled = state.busy && state.operation !== 'apps';
        $('download-parameters').disabled = state.busy && state.operation !== 'parameters';
        for (const [operation, id] of [['apps', 'apps-pending'], ['parameters', 'parameters-pending']]) {
            const active = state.busy && state.operation === operation;
            $(id).hidden = !active && !controller.pending(operation);
            $(id).textContent = active ? 'View progress' : 'Not finished · Continue';
        }
        if (changedPage && !state.closed) {
            $('main-content').scrollTop = 0;
            $('page-title').focus({ preventScroll: true });
        }
        const announcement = [...state.apps, ...state.parameters].filter(item => ['success', 'error'].includes(item.status)).map(item => item.name + ': ' + item.phase).join('. ');
        if (announcement !== lastAnnouncement) { $('task-announcement').textContent = announcement; lastAnnouncement = announcement; }
    }

    let pressPending = false;
    async function activateWithFeedback(button, action) {
        if (button.disabled || pressPending) return;
        pressPending = true;
        const generation = controller.generation;
        button.classList.add('is-pressed');
        // Keep quick taps and Enter visible before the next screen replaces the control.
        await new Promise(resolve => setTimeout(resolve, 140));
        button.classList.remove('is-pressed');
        pressPending = false;
        if (controller.generation === generation && !controller.state.closed) await action();
    }

    controller = new Configuration(gateway, render);
    $('setup-form').addEventListener('submit', async event => {
        event.preventDefault();
        const value = input.value;
        await activateWithFeedback($('setup-button'), () => controller.start('setup', value));
        if (controller.state.error && controller.state.binding === 'unbound') input.focus();
    });
    function returnHome() {
        if (controller.goHome() && history.state?.configureTask) history.back();
    }
    $('task-done').addEventListener('click', returnHome);
    $('task-back').addEventListener('click', returnHome);
    $('task-check-status').addEventListener('click', () => controller.checkTaskStatus());
    $('task-retry').addEventListener('click', () => controller.start(controller.state.operation));
    // Browser Back follows the same task guard. Native shells must wire their Back action here.
    window.addEventListener('popstate', () => {
        if (controller.state.page !== 'task' || controller.state.closed) return;
        if (!controller.goHome()) history.pushState({ configureTask: true }, '');
    });
    input.addEventListener('input', () => {
        const normalized = normalizeTci(input.value);
        if (input.value !== normalized) input.value = normalized;
        if (controller.state.error) { controller.state.error = ''; controller.emit(); }
    });
    $('download-app').addEventListener('click', () => activateWithFeedback($('download-app'), () => controller.start('apps')));
    $('download-parameters').addEventListener('click', () => activateWithFeedback($('download-parameters'), () => controller.start('parameters')));
    $('query-retry').addEventListener('click', () => controller.enter());

    function showDemo() {
        if (controller.state.busy || controller.state.closed) return;
        $('demo-state').value = gateway.record.scenario;
        $('demo-modal').showModal();
    }
    $('app-title').addEventListener('pointerdown', () => { titleHoldTimer = setTimeout(showDemo, 700); });
    for (const event of ['pointerup', 'pointercancel', 'pointerleave']) $('app-title').addEventListener(event, () => clearTimeout(titleHoldTimer));
    $('app-title').addEventListener('keydown', event => { if (event.shiftKey && event.key === 'Enter') { event.preventDefault(); showDemo(); } });
    $('demo-cancel').addEventListener('click', () => $('demo-modal').close());
    $('demo-apply').addEventListener('click', () => {
        gateway.reset($('demo-state').value);
        input.value = '';
        $('demo-modal').close();
        $('main-content').scrollTop = 0;
        controller.enter();
    });
    $('exit-app-button').addEventListener('click', () => {
        if (controller.state.page !== 'home') return;
        if (!controller.state.busy) { controller.close(); $('reopen-app').focus(); return; }
        $('exit-message').textContent = 'A task is still running. Exiting may interrupt it. Exit application?';
        $('exit-modal').showModal();
        $('exit-cancel').focus();
    });
    $('exit-cancel').addEventListener('click', () => $('exit-modal').close());
    $('exit-confirm').addEventListener('click', () => {
        $('exit-modal').close(); controller.close(); $('reopen-app').focus();
    });
    $('reopen-app').addEventListener('click', async () => {
        input.value = ''; await controller.enter(); $('exit-app-button').focus();
    });
    // The demo stops local jobs on navigation, and re-queries its adapter on re-entry.
    window.addEventListener('pagehide', () => controller.close());
    window.addEventListener('pageshow', event => { if (event.persisted) controller.enter(); });
    function updateTime() { $('status-time').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }); }
    updateTime(); setInterval(updateTime, 30000);
    setInterval(() => controller.checkStall(), 1000);
    controller.enter();
})();
