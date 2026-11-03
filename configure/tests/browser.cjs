// Independent headless browser; local prototype only. No user's browser session.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.CONFIGURE_TEST_URL || 'http://127.0.0.1:8765/27.Paywizard_config.html';
const mini = new URL(base).searchParams.get('model') === 'q3mini';
const out = '.impeccable/review/configure-navigation' + (mini ? '-q3mini' : '');
fs.mkdirSync(out, { recursive: true });
(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [], results = [];
    async function page(scenario = 'unbound', width = mini ? 480 : 390, height = mini ? 480 : 844, virtualTime = false) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const p = await context.newPage();
        if (virtualTime) await p.clock.install();
        p.on('pageerror', e => errors.push(e.message));
        p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        const url = new URL(base);
        url.searchParams.set('view', 'terminal');
        url.searchParams.set('scenario', scenario);
        await p.goto(url.href);
        if (virtualTime) await p.clock.runFor(700);
        await p.waitForFunction(() => document.getElementById('setup-button').hasAttribute('aria-busy') && !document.getElementById('setup-label').textContent.includes('Checking terminal')).catch(async error => {
            console.error('Startup failed', { scenario, width, height, errors, state: await p.evaluate(() => ({ url: location.href, ready: document.readyState, model: Boolean(window.ConfigureModel), preview: window.ConfigurePreview, label: document.getElementById('setup-label')?.textContent })) });
            throw error;
        });
        return p;
    }
    async function ended(p) { await p.locator('#task-done').waitFor({ timeout: 25000 }); }
    async function noOverflow(p) {
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await p.locator('main').evaluate(el => el.scrollWidth > el.clientWidth), false);
    }
    async function home(p) {
        assert.equal(await p.locator('#terminal-footer').isVisible(), true);
        assert.equal(await p.locator('#individual-actions').isVisible(), true);
        assert.equal(await p.locator('#results-area').isVisible(), false);
        assert.equal(await p.locator('#setup-button').isVisible(), false);
        assert.equal(await p.locator('#tci-value').innerText(), 'TC12345678');
        assert.equal(await p.locator('#tcid-input').isVisible(), false);
    }
    try {
        for (const [name, width, height] of [['mobile', 390, 844], ['small', 320, 568], ['square', 480, 480], ['desktop', 1440, 1000]]) {
            for (const scenario of ['unbound', 'bound', 'configured']) {
                const p = await page(scenario, width, height);
                assert.equal(await p.locator('#exit-app-button').innerText(), 'Exit');
                assert.equal(await p.getByText('This terminal', { exact: true }).count(), 0);
                const serial = await p.locator('#terminal-serial').boundingBox();
                const exit = await p.locator('#exit-app-button').boundingBox();
                assert.ok(Math.abs(serial.y + serial.height / 2 - exit.y - exit.height / 2) < 1);
                if (scenario === 'configured') await home(p);
                else assert.equal(await p.locator('#individual-actions').isVisible(), false);
                if (scenario === 'bound') {
                    assert.equal(await p.locator('#tcid-input').isVisible(), false);
                    assert.equal(await p.locator('#setup-label').innerText(), 'Set up terminal');
                }
                await noOverflow(p); await p.screenshot({ path: `${out}/${name}-${scenario}.png` });
                await p.context().close();
            }
        }
        results.push('Four viewport sizes: unbound, locked prebound and clean dual-entry home');
        const p = await page();
        await p.locator('#tcid-input').fill('123456789'); await p.locator('#setup-button').click();
        await p.locator('#tcid-error').waitFor();
        assert.match(await p.locator('#tcid-error').innerText(), /8 digits/);
        await p.locator('#tcid-input').fill('TC00009999'); await p.locator('#setup-button').click();
        await p.waitForFunction(() => document.getElementById('tcid-error').textContent.includes('another terminal'));
        await p.locator('#tcid-input').fill('TC12345678');
        assert.equal(await p.locator('#tcid-input').inputValue(), '12345678');
        await p.locator('#setup-button').click();
        await p.locator('#results-area').waitFor();
        assert.equal(await p.locator('#task-back').isVisible(), false);
        assert.equal(await p.locator('#terminal-serial').isVisible(), false);
        assert.equal(await p.locator('#exit-app-button').isVisible(), false);
        assert.equal(await p.locator('#terminal-footer').isVisible(), false);
        assert.equal(await p.locator('#page-title').evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        assert.equal(await p.locator('#task-done').isVisible(), false);
        await p.evaluate(() => history.back());
        await p.waitForTimeout(150);
        assert.equal(await p.locator('#results-area').isVisible(), true);
        await p.screenshot({ path: out + '/running.png' });
        await ended(p);
        assert.equal(await p.locator('.task-item.success').count(), 4);
        assert.equal(await p.locator('#individual-actions').isVisible(), false);
        await p.locator('#task-done').click(); await home(p);
        await p.locator('#exit-app-button').click(); await p.locator('#reopen-app').click();
        await p.locator('#individual-actions').waitFor(); await home(p);
        await p.locator('#download-app').click(); await ended(p);
        assert.equal(await p.locator('#parameter-results').isVisible(), false);
        await p.locator('#task-done').click(); await home(p);
        results.push('Validation, setup, Back guard, explicit Done, re-entry and apps-only task');
        await p.context().close();
        const f = await page('app-failure');
        await f.locator('#setup-button').click(); await ended(f);
        assert.equal(await f.locator('#task-done').innerText(), 'Done');
        assert.equal(await f.locator('.task-retry:visible').count(), 1);
        assert.equal(await f.locator('#parameter-results').isVisible(), false);
        await f.locator('#task-done').click();
        assert.equal(await f.locator('#setup-label').innerText(), 'Continue setup');
        await f.locator('#setup-button').click(); await ended(f);
        assert.equal(await f.locator('.task-item.success').count(), 4);
        await f.locator('#task-done').click(); await home(f);
        results.push('Failed first setup returns to Continue setup and preserves successful work');
        await f.context().close();
        const m = await page('maintenance-failure');
        await m.locator('#download-parameters').click(); await ended(m);
        assert.equal(await m.locator('.task-item.error').count(), 1);
        await m.screenshot({ path: out + '/maintenance-failure.png' });
        await m.locator('#task-done').click(); await home(m);
        assert.equal(await m.locator('#parameters-pending').isVisible(), true);
        await m.screenshot({ path: out + '/maintenance-pending.png' });
        await m.evaluate(() => {
            const url = new URL(location.href);
            url.searchParams.delete('scenario');
            history.replaceState(history.state, '', url);
        });
        await m.reload(); await m.locator('#individual-actions').waitFor(); await home(m);
        assert.equal(await m.locator('#parameters-pending').isVisible(), true);
        await m.locator('#download-app').click(); await ended(m); await m.locator('#task-done').click();
        assert.equal(await m.locator('#parameters-pending').isVisible(), true);
        await m.locator('#download-parameters').click(); await ended(m);
        assert.equal(await m.locator('.task-item.success').count(), 4);
        await m.locator('#task-done').click();
        assert.equal(await m.locator('#parameters-pending').isVisible(), false);
        await m.locator('#app-title').focus(); await m.keyboard.press('Shift+Enter');
        assert.equal(await m.locator('#demo-modal').isVisible(), true); await m.keyboard.press('Escape');
        results.push('Maintenance failure survives reload and other task; resume keeps dual-entry home');
        await m.context().close();
        for (const [operation, action] of [['setup', 'setup-button'], ['apps', 'download-app'], ['parameters', 'download-parameters']]) {
            const e = await page('stalled-' + operation, mini ? 480 : 390, mini ? 480 : 844, true);
            await e.locator('#' + action).click(); await e.clock.runFor(3000);
            assert.equal(await e.locator('#exit-app-button').isVisible(), false);
            assert.equal(await e.locator('#task-done').isVisible(), false);
            assert.equal(await e.locator('#task-back').isVisible(), false);
            await e.clock.runFor(121000);
            assert.equal(await e.locator('#task-back').isVisible(), true);
            await e.screenshot({ path: out + '/stalled-' + operation + '.png' });
            await e.locator('#task-back').click();
            assert.equal(await e.locator('#exit-app-button').isVisible(), true);
            assert.ok((await e.locator('#' + action).innerText()).includes('View progress'));
            if (operation !== 'setup') assert.equal(await e.locator(operation === 'apps' ? '#download-parameters' : '#download-app').isDisabled(), true);
            await e.locator('#exit-app-button').click();
            assert.equal(await e.locator('#exit-modal').isVisible(), true);
            await e.locator('#exit-cancel').click();
            await e.locator('#' + action).click(); await e.clock.runFor(200);
            assert.equal(await e.locator('#task-back').isVisible(), true);
            assert.equal(await e.locator('#exit-app-button').isVisible(), false);
            // Recovery removes the escape route; the 180-second pause starts per item.
            await e.clock.runFor(60000);
            assert.equal(await e.locator('#task-back').isVisible(), false);
            await e.clock.runFor(15000);
            assert.equal(await e.locator('#task-done').innerText(), 'Done');
            assert.equal(await e.locator('#task-done').isVisible(), true);
            assert.equal(await e.locator('#exit-app-button').isVisible(), false);
            await e.locator('#task-done').click(); await home(e);
            await e.context().close();
        }
        results.push('Three workflows: 120-second inactivity escape, home-only Exit, guarded re-entry, recovery and Done');
        const q = await page('query-failure');
        assert.equal(await q.locator('#tcid-input').isDisabled(), true);
        assert.equal(await q.locator('#individual-actions').isVisible(), false);
        await q.locator('#query-retry').click(); await q.locator('#query-retry').waitFor();
        assert.equal(await q.locator('#tcid-input').isDisabled(), true);
        results.push('Lookup failure blocks editing and task initiation'); await q.context().close();
        // Each action must inspect current installed state, with different update policies.
        await Promise.all([
            ['apps-outdated', 'download-app', '2.9.1', true],
            ['apps-outdated', 'download-parameters', '2.8.0', false],
            ['app-uninstalled', 'download-app', '1.2.8', true],
            ['app-uninstalled', 'download-parameters', '1.2.8', true]
        ].map(async ([scenario, action, version, delivered]) => {
            const v = await page(scenario);
            await v.locator('#' + action).click(); await ended(v);
            const row = v.locator('[data-task-id="' + (scenario === 'apps-outdated' ? 'paywizard-app' : 'payment-app') + '"]');
            assert.ok((await row.locator('.task-version').innerText()).includes(version));
            assert.equal(await row.locator('.task-progress').isVisible(), delivered);
            assert.equal(await row.locator('.task-percent').isVisible(), delivered);
            if (action === 'download-parameters') {
                assert.equal(await v.locator('#app-results-title').innerText(), 'Application check');
                assert.equal(await v.locator('#parameter-task-list .success').count(), 2);
            } else assert.equal(await v.locator('#parameter-results').isVisible(), false);
            await v.screenshot({ path: out + '/' + scenario + '-' + action + '.png' });
            await v.context().close();
        }));
        const inventory = await page('inventory-failure');
        await inventory.locator('#download-parameters').click(); await ended(inventory);
        assert.match(await inventory.locator('#task-error').innerText(), /check installed applications/);
        assert.equal(await inventory.locator('#parameter-results').isVisible(), false);
        await inventory.context().close();
        results.push('App updates versus presence-only parameter checks; missing app installation; inventory query failure');
        const large = await page('configured', 320, 568);
        await large.addStyleTag({ content: 'button{font-size:200%!important} .terminal-footer{font-size:150%!important}' });
        await noOverflow(large); await large.locator('#download-parameters').scrollIntoViewIfNeeded();
        await large.screenshot({ path: out + '/large-text.png' }); await large.context().close();
        assert.deepEqual(errors, []);
        const report = { passed: results, consoleErrors: errors };
        fs.writeFileSync(out + '/browser-results.json', JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
