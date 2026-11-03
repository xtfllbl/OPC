(function () {
    'use strict';
    const params = new URLSearchParams(location.search);
    const normalizeModel = value => value === 'q3mini' ? 'q3mini' : 'portrait';
    let model = normalizeModel(params.get('model'));
    const embedded = params.get('view') === 'terminal';
    window.ConfigurePreview = { isShell: !embedded };

    function rememberModel(value) {
        const url = new URL(location.href);
        if (value === 'q3mini') url.searchParams.set('model', value);
        else url.searchParams.delete('model');
        // Retain task history markers. File previews may disallow URL changes.
        try { history.replaceState(history.state, '', url); } catch (_) { /* Layout still switches. */ }
    }

    if (embedded) {
        document.getElementById('preview-workspace').remove();
        function applyModel(value) {
            model = normalizeModel(value);
            document.documentElement.dataset.model = model;
            const actions = document.getElementById('task-actions');
            if (model === 'q3mini') {
                document.getElementById('app-content').insertBefore(actions, document.getElementById('terminal-footer'));
            } else {
                document.getElementById('main-content').insertBefore(actions, document.getElementById('task-announcement'));
            }
            rememberModel(model);
        }
        applyModel(model);
        window.addEventListener('message', event => {
            const sameOrigin = event.origin === location.origin || (location.protocol === 'file:' && event.origin === 'null');
            if (event.source !== parent || !sameOrigin) return;
            if (event.data?.type === 'configure-preview-model') applyModel(event.data.model);
        });
        return;
    }

    document.getElementById('terminal-app').remove();
    document.querySelector('.icon-definitions').remove();
    document.body.classList.add('preview-host');
    const workspace = document.getElementById('preview-workspace');
    const selector = document.getElementById('preview-model');
    const frame = document.getElementById('terminal-preview');
    workspace.hidden = false;
    function applyPreview() {
        workspace.dataset.model = model;
        selector.value = model;
        frame.contentWindow?.postMessage({ type: 'configure-preview-model', model }, location.protocol === 'file:' ? '*' : location.origin);
    }
    selector.addEventListener('change', () => {
        model = normalizeModel(selector.value);
        applyPreview();
        rememberModel(model);
    });
    frame.addEventListener('load', applyPreview);
    const terminalUrl = new URL(location.href);
    terminalUrl.searchParams.set('view', 'terminal');
    // Set src once. Model changes keep this document and its live task controller.
    frame.src = terminalUrl.href;
    applyPreview();
})();
