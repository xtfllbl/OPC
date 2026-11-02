(function () {
    'use strict';
    const { DemoGateway, Configuration, normalizeTci } = window.ConfigureModel;
    const $ = id => document.getElementById(id);
    let storage = null;
    try { storage = window.sessionStorage; } catch (_) { /* File/private browsing fallback. */ }
    const gateway = new DemoGateway({ storage });
    const scenarios = ['unbound', 'bound', 'swap', 'query-failure', 'app-failure', 'parameter-failure'];
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
            elements.version.textContent = item.version;
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

    function render(state) {
        const bound = state.binding === 'bound';
        const hasResults = state.apps.length + state.parameters.length > 0;
        const complete = controller?.complete || false;
        const failures = controller?.failures || false;
        $('terminal-app').classList.toggle('has-results', hasResults);
        $('app-content').hidden = state.closed;
        $('exit-screen').hidden = !state.closed;
        if (hasResults) $('page-title').textContent = 'Your terminal';
        else $('page-title').innerHTML = 'Set up your<br>terminal';
        input.disabled = !['unbound', 'bound'].includes(state.binding);
        input.readOnly = bound || state.busy;
        if (bound) input.value = state.tci.slice(2);
        input.setAttribute('aria-readonly', String(input.readOnly));
        input.setAttribute('aria-invalid', String(Boolean(state.error && !bound)));
        input.closest('.input-wrap').classList.toggle('invalid', Boolean(state.error && !bound));
        $('tcid-error').textContent = state.error;
        $('tcid-error').hidden = !state.error;
        // Initial lookup uses the primary control, preserving the approved first-use layout.
        $('binding-message').textContent = state.message;
        $('binding-message').hidden = !state.message || state.binding === 'loading' || state.busy;
        $('query-retry').hidden = state.binding !== 'error';
        $('setup-button').hidden = state.binding === 'error' || failures;
        $('setup-button').disabled = state.busy || !['bound', 'unbound'].includes(state.binding);
        $('setup-button').setAttribute('aria-busy', String(state.busy || state.binding === 'loading'));
        $('setup-label').textContent = state.binding === 'loading' ? 'Checking terminal…' : state.busy ? (state.message || 'Setting up…') : complete ? 'Update Parameters' : 'Set up terminal';
        $('setup-button').querySelector('.button-spinner').hidden = !state.busy && state.binding !== 'loading';
        $('setup-button').querySelector('.button-arrow').toggleAttribute('hidden', state.busy || state.binding === 'loading');
        $('results-area').hidden = !hasResults;
        renderTasks('apps', 'app-task-list', 'app-results', state.apps, state.busy);
        renderTasks('parameters', 'parameter-task-list', 'parameter-results', state.parameters, state.busy);
        $('individual-actions').hidden = !bound;
        $('download-app').disabled = state.busy || failures;
        $('download-parameters').disabled = state.busy || failures;
        // Once configured, the primary Update Parameters control is the parameter action.
        $('download-parameters').hidden = complete;
        const announcement = [...state.apps, ...state.parameters].filter(item => ['success', 'error'].includes(item.status)).map(item => item.name + ': ' + item.phase).join('. ');
        if (announcement !== lastAnnouncement) { $('task-announcement').textContent = announcement; lastAnnouncement = announcement; }
    }

    controller = new Configuration(gateway, render);
    $('setup-form').addEventListener('submit', async event => {
        event.preventDefault();
        await controller.start(controller.complete ? 'parameters' : 'setup', input.value);
        if (controller.state.error && controller.state.binding === 'unbound') input.focus();
    });
    input.addEventListener('input', () => {
        const normalized = normalizeTci(input.value);
        if (input.value !== normalized) input.value = normalized;
        if (controller.state.error) { controller.state.error = ''; controller.emit(); }
    });
    $('download-app').addEventListener('click', () => controller.start('apps'));
    $('download-parameters').addEventListener('click', () => controller.start('parameters'));
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
        if (!controller.state.busy) { controller.close(); $('reopen-app').focus(); return; }
        $('exit-message').textContent = 'Setup is still in progress. Exiting may interrupt the current task. Continue setup or exit?';
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
    controller.enter();
})();
