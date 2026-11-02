// Run against a localhost static server. Uses a new headless browser, never a user's browser session.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.CONFIGURE_TEST_URL || 'http://127.0.0.1:8765/27.device_manager.html';
const out = '.impeccable/review';
fs.mkdirSync(out, { recursive: true });
(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [], results = [];
    async function page(width = 390, height = 844, scenario = 'unbound') {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
        const p = await context.newPage();
        p.on('pageerror', error => errors.push(error.message));
        p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await p.goto(base + '?scenario=' + scenario);
        await p.waitForFunction(() => !document.getElementById('setup-label').textContent.includes('Checking terminal'));
        return p;
    }
    async function noOverflow(p) {
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await p.locator('main').evaluate(el => el.scrollWidth > el.clientWidth), false);
    }
    try {
        // Capture each supported size before flows, with real timers and CSS.
        for (const [name, width, height] of [['mobile', 390, 844], ['desktop', 1440, 1000], ['small', 320, 568]]) {
            const p = await page(width, height);
            assert.equal(await p.locator('#individual-actions').isVisible(), false);
            await p.locator('#tcid-input').fill('12345678'); await p.locator('#page-title').click();
            await noOverflow(p); await p.screenshot({ path: out + '/' + name + '.png', fullPage: true });
            results.push(name + ': initial unbound layout and hidden independent actions');
            await p.context().close();
        }
        const p = await page();
        await p.locator('#tcid-input').fill('123456789'); await p.locator('#setup-button').click();
        assert.match(await p.locator('#tcid-error').innerText(), /8 digits/);
        await p.locator('#tcid-input').fill('TC00009999'); await p.locator('#setup-button').click();
        await p.waitForFunction(() => document.getElementById('tcid-error').textContent.includes('another terminal'));
        assert.equal(await p.locator('#individual-actions').isVisible(), false);
        assert.equal(await p.locator('#tcid-input').getAttribute('aria-readonly'), 'false');
        await p.screenshot({ path: out + '/binding-error.png' });
        await p.locator('#tcid-input').fill('TC12345678');
        assert.equal(await p.locator('#tcid-input').inputValue(), '12345678');
        await p.locator('#tcid-input').press('Enter');
        await p.locator('#app-task-list .task-item').first().waitFor();
        assert.equal(await p.locator('#tcid-input').getAttribute('aria-readonly'), 'true');
        assert.equal(await p.locator('#download-app').isDisabled(), true);
        await p.screenshot({ path: out + '/working.png' });
        await p.waitForFunction(() => document.getElementById('setup-label').textContent === 'Update Parameters', { timeout: 20000 });
        assert.equal(await p.locator('.task-item.success').count(), 4);
        assert.equal(await p.locator('#download-app').isVisible(), true);
        assert.equal(await p.locator('#download-parameters').isVisible(), false);
        await noOverflow(p); await p.screenshot({ path: out + '/configured.png' });
        await p.locator('#exit-app-button').click(); await p.locator('#reopen-app').click();
        await p.waitForFunction(() => document.getElementById('setup-label').textContent === 'Update Parameters');
        assert.equal(await p.locator('.task-item.success').count(), 4);
        results.push('TCI length, full-value normalization, occupied binding, one-click setup, installed/applied results and reopen');
        await p.context().close();
        const q = await page(390, 844, 'query-failure');
        assert.equal(await q.locator('#tcid-input').isDisabled(), true);
        assert.equal(await q.locator('#individual-actions').isVisible(), false);
        assert.equal(await q.locator('#setup-button').isVisible(), false);
        await q.locator('#query-retry').click();
        await q.locator('#query-retry').waitFor();
        assert.equal(await q.locator('#tcid-input').isDisabled(), true);
        await q.screenshot({ path: out + '/query-error.png' });
        results.push('failed lookup stays closed to binding even after retry'); await q.context().close();
        const f = await page(390, 844, 'app-failure');
        await f.locator('#setup-button').click();
        const retry = f.getByRole('button', { name: 'Retry Paywizard TSYS', exact: true });
        await retry.waitFor();
        await f.waitForFunction(() => !document.querySelector('.task-retry:not([hidden])').disabled);
        assert.equal(await f.locator('#parameter-results').isVisible(), false);
        assert.match(await f.locator('[data-task-id="paywizard-app"]').innerText(), /Installed/);
        await retry.scrollIntoViewIfNeeded(); await f.screenshot({ path: out + '/app-failure.png' });
        await retry.click();
        await f.waitForFunction(() => document.getElementById('setup-label').textContent === 'Update Parameters', { timeout: 20000 });
        assert.equal(await f.locator('.task-item.success').count(), 4);
        results.push('app failure blocks parameters; item retry resumes remaining setup'); await f.context().close();
        const params = await page(390, 844, 'parameter-failure');
        await params.locator('#setup-button').click();
        const parameterRetry = params.getByRole('button', { name: 'Retry Paywizard TSYS parameters', exact: true });
        await parameterRetry.waitFor();
        await params.waitForFunction(() => !document.querySelector('.task-retry:not([hidden])').disabled);
        assert.match(await params.locator('[data-task-id="paywizard-parameters"]').innerText(), /Applied/);
        assert.notEqual(await params.locator('#setup-label').innerText(), 'Update Parameters');
        await parameterRetry.scrollIntoViewIfNeeded(); await params.screenshot({ path: out + '/parameter-failure.png' });
        await parameterRetry.click();
        await params.waitForFunction(() => document.getElementById('setup-label').textContent === 'Update Parameters');
        await params.locator('#download-app').scrollIntoViewIfNeeded();
        await params.screenshot({ path: out + '/configured-bottom.png' });
        assert.equal(await params.locator('.task-item.success').count(), 4);
        await params.locator('#app-title').focus(); await params.keyboard.press('Shift+Enter');
        assert.equal(await params.locator('#demo-modal').isVisible(), true);
        await params.keyboard.press('Escape'); assert.equal(await params.locator('#demo-modal').isVisible(), false);
        results.push('partial parameter failure, per-group retry, bottom results and keyboard demo dialog'); await params.context().close();
        const e = await page();
        await e.locator('#tcid-input').fill('12345678'); await e.locator('#setup-button').click();
        await e.locator('#exit-app-button').click();
        assert.equal(await e.locator('#exit-modal').isVisible(), true);
        await e.locator('#exit-cancel').click(); assert.equal(await e.locator('#exit-screen').isVisible(), false);
        await e.locator('#exit-app-button').click(); await e.locator('#exit-confirm').click();
        await e.waitForTimeout(1500); assert.equal(await e.locator('#exit-screen').isVisible(), true);
        await e.locator('#reopen-app').click();
        await e.waitForFunction(() => !document.getElementById('setup-label').textContent.includes('Checking terminal'));
        assert.notEqual(await e.locator('#setup-label').innerText(), 'Update Parameters');
        results.push('exit confirmation, cancellation and no false completion after interruption'); await e.context().close();
        const large = await page(320, 568);
        await large.addStyleTag({ content: 'button,input{font-size:200%!important} .helper,.terminal-footer{font-size:200%!important}' });
        await noOverflow(large);
        await large.locator('#setup-button').scrollIntoViewIfNeeded();
        await large.screenshot({ path: out + '/large-text.png' });
        results.push('320px and enlarged controls remain scrollable without horizontal overflow'); await large.context().close();
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ passed: results, consoleErrors: errors }, null, 2));
        fs.writeFileSync(out + '/browser-results.json', JSON.stringify({ passed: results, consoleErrors: errors }, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
