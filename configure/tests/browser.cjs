// Independent headless browser; local prototype only. No user's browser session.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.CONFIGURE_TEST_URL || 'http://127.0.0.1:8765/27.device_manager.html';
const out = '.impeccable/review/reentry';
fs.mkdirSync(out, { recursive: true });
(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [], results = [];
    async function page(scenario = 'unbound', width = 390, height = 844) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const p = await context.newPage();
        p.on('pageerror', e => errors.push(e.message));
        p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await p.goto(base + '?scenario=' + scenario);
        await p.waitForFunction(() => !document.getElementById('setup-label').textContent.includes('Checking terminal'));
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
        for (const [name, width, height] of [['mobile', 390, 844], ['small', 320, 568], ['desktop', 1440, 1000]]) {
            for (const scenario of ['unbound', 'bound', 'configured']) {
                const p = await page(scenario, width, height);
                assert.equal(await p.locator('#exit-app-button').innerText(), 'Exit');
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
        results.push('Three viewport sizes: unbound, locked prebound and clean dual-entry home');
        const p = await page();
        await p.locator('#tcid-input').fill('123456789'); await p.locator('#setup-button').click();
        assert.match(await p.locator('#tcid-error').innerText(), /8 digits/);
        await p.locator('#tcid-input').fill('TC00009999'); await p.locator('#setup-button').click();
        await p.waitForFunction(() => document.getElementById('tcid-error').textContent.includes('another terminal'));
        await p.locator('#tcid-input').fill('TC12345678');
        assert.equal(await p.locator('#tcid-input').inputValue(), '12345678');
        await p.locator('#setup-button').click();
        await p.locator('#results-area').waitFor();
        assert.equal(await p.locator('#task-back').count(), 0);
        assert.equal(await p.locator('#terminal-footer').isVisible(), false);
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
        await m.evaluate(() => history.replaceState(null, '', location.pathname));
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
        const e = await page('bound');
        await e.locator('#setup-button').click(); await e.locator('#results-area').waitFor();
        await e.locator('#exit-app-button').click(); assert.equal(await e.locator('#exit-modal').isVisible(), true);
        await e.locator('#exit-cancel').click(); assert.equal(await e.locator('#results-area').isVisible(), true);
        await e.locator('#exit-app-button').click(); await e.locator('#exit-confirm').click();
        await e.locator('#reopen-app').click(); await e.locator('#setup-button').waitFor();
        await e.waitForFunction(() => document.getElementById('setup-label').textContent === 'Continue setup');
        assert.equal(await e.locator('#individual-actions').isVisible(), false);
        await e.screenshot({ path: out + '/continue-setup.png' });
        results.push('Busy Exit confirmation and interrupted setup restoration'); await e.context().close();
        const q = await page('query-failure');
        assert.equal(await q.locator('#tcid-input').isDisabled(), true);
        assert.equal(await q.locator('#individual-actions').isVisible(), false);
        await q.locator('#query-retry').click(); await q.locator('#query-retry').waitFor();
        assert.equal(await q.locator('#tcid-input').isDisabled(), true);
        results.push('Lookup failure blocks editing and task initiation'); await q.context().close();
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
