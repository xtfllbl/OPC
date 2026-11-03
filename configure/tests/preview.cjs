// Exercises the actual outer selector and the same live terminal frame.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.CONFIGURE_TEST_URL || 'http://127.0.0.1:8765/27.Paywizard_config.html';
const out = '.impeccable/review/configure-q3mini';
fs.mkdirSync(out, { recursive: true });
(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [], passed = [];
    async function open(scenario, model = 'q3mini', width = 1000, height = 1000) {
        const p = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        p.on('pageerror', e => errors.push(e.message));
        p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await p.clock.install();
        if (scenario === 'unknown') await p.addInitScript(() => {
            if (new URLSearchParams(location.search).get('view') !== 'terminal') return;
            sessionStorage.setItem('paywizard-configure-v3', JSON.stringify({ version: 3, record: {
                scenario: 'configured', binding: 'TC12345678', bindingRevision: 1, setupScope: 'TC12345678:1',
                installed: {}, consumed: {}, reads: { apps: 0, parameters: 0 },
                jobs: { parameters: { scope: 'TC12345678:1', apps: [], parameters: [], stage: 'parameterManifest', status: 'running', error: '' } }
            } }));
        });
        const url = new URL(base);
        url.searchParams.set('scenario', scenario);
        if (model === 'q3mini') url.searchParams.set('model', model);
        await p.goto(url.href);
        const f = await (await p.locator('#terminal-preview').elementHandle()).contentFrame();
        await p.clock.runFor(1000);
        await f.waitForFunction(() => document.getElementById('setup-button').hasAttribute('aria-busy') && !document.getElementById('setup-label').textContent.includes('Checking terminal'));
        await f.evaluate(() => { window.previewIdentity = {}; });
        const identity = await f.evaluateHandle(() => window.previewIdentity);
        return { p, f, identity };
    }
    async function switchTo(test, model) {
        const { p, f, identity } = test;
        await p.locator('#preview-model').selectOption(model);
        await f.waitForFunction(value => document.documentElement.dataset.model === value, model);
        assert.equal(await f.evaluate(original => window.previewIdentity === original, identity), true);
        assert.equal(new URL(p.url()).searchParams.get('model'), model === 'q3mini' ? model : null);
    }
    async function layout({ p, f }) {
        assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await f.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await f.locator('main').evaluate(el => el.scrollWidth > el.clientWidth), false);
    }
    async function pinned(f, selector) {
        const box = await f.locator(selector).boundingBox();
        const frameBox = await f.frameElement().then(el => el.boundingBox());
        assert.ok(box.y >= frameBox.y && box.y + box.height <= frameBox.y + frameBox.height + 1);
        assert.equal(await f.locator('#task-actions').evaluate(el => el.parentElement.id), 'app-content');
    }
    try {
        for (const scenario of ['unbound', 'bound', 'configured', 'query-failure']) {
            const t = await open(scenario);
            const box = await t.p.locator('#terminal-preview').boundingBox();
            assert.equal(box.width, 480); assert.equal(box.height, 480);
            await layout(t);
            if (scenario !== 'query-failure') {
                assert.equal(await t.f.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight), true);
            }
            await t.p.screenshot({ path: `${out}/${scenario}.png` });
            await t.p.close();
        }
        passed.push('Direct square preview: four startup states; normal homes fit without scrolling');

        const input = await open('unbound', 'portrait');
        await input.f.locator('#tcid-input').fill('12345678');
        await switchTo(input, 'q3mini');
        assert.equal(await input.f.locator('#tcid-input').inputValue(), '12345678');
        await input.f.locator('#tcid-input').fill('00009999');
        await input.f.locator('#setup-button').click(); await input.p.clock.runFor(1500);
        assert.match(await input.f.locator('#tcid-error').innerText(), /another terminal/);
        await switchTo(input, 'portrait'); await switchTo(input, 'q3mini');
        assert.match(await input.f.locator('#tcid-error').innerText(), /another terminal/);
        await layout(input);
        await input.p.screenshot({ path: `${out}/input-error.png` });
        await input.f.locator('#tcid-input').fill('12345678');
        await input.f.locator('#setup-button').click(); await input.p.clock.runFor(1200);
        assert.equal(await input.f.locator('#results-area').isVisible(), true);
        const reads = await input.f.evaluate(() => JSON.parse(sessionStorage.getItem('paywizard-configure-v3')).reads);
        await switchTo(input, 'portrait'); await switchTo(input, 'q3mini');
        assert.deepEqual(await input.f.evaluate(() => JSON.parse(sessionStorage.getItem('paywizard-configure-v3')).reads), reads);
        await input.p.screenshot({ path: `${out}/running.png` });
        await input.p.clock.runFor(20000);
        assert.equal(await input.f.locator('.task-item.success').count(), 4);
        await pinned(input.f, '#task-done');
        await input.f.locator('main').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await pinned(input.f, '#task-done'); await layout(input);
        await input.p.screenshot({ path: `${out}/completed.png` });
        await input.f.locator('#task-done').click();
        await input.f.locator('#individual-actions').waitFor();
        await input.f.locator('#exit-app-button').click();
        await switchTo(input, 'portrait'); await switchTo(input, 'q3mini');
        assert.equal(await input.f.locator('#exit-screen').isVisible(), true);
        await input.f.locator('#reopen-app').click(); await input.p.clock.runFor(1000);
        assert.equal(await input.f.locator('#individual-actions').isVisible(), true);
        await input.p.close();
        passed.push('Input, validation error, active setup and closed app survive switching; setup finishes once and Done stays visible');

        const stalled = await open('stalled-parameters');
        await stalled.f.locator('#download-parameters').click(); await stalled.p.clock.runFor(124000);
        await pinned(stalled.f, '#task-back');
        await stalled.p.screenshot({ path: `${out}/stalled.png` });
        await stalled.f.locator('#task-back').click();
        await stalled.f.locator('#exit-app-button').click();
        assert.equal(await stalled.f.locator('#exit-modal').isVisible(), true);
        await switchTo(stalled, 'portrait'); await switchTo(stalled, 'q3mini');
        assert.equal(await stalled.f.locator('#exit-modal').isVisible(), true);
        const modal = await stalled.f.locator('#exit-modal').boundingBox();
        const frame = await stalled.p.locator('#terminal-preview').boundingBox();
        assert.ok(modal.x >= frame.x && modal.y >= frame.y && modal.x + modal.width <= frame.x + frame.width && modal.y + modal.height <= frame.y + frame.height);
        await stalled.p.screenshot({ path: `${out}/exit-dialog.png` });
        await stalled.f.locator('#exit-cancel').click();
        await stalled.f.locator('#download-parameters').click(); await stalled.p.clock.runFor(200);
        assert.equal(await stalled.f.locator('#task-back').isVisible(), true);
        await stalled.p.clock.runFor(80000);
        assert.equal(await stalled.f.locator('#task-done').isVisible(), true);
        await stalled.p.close();
        passed.push('Stalled return and native exit dialog survive model switches; same task recovers');

        const demo = await open('configured');
        await demo.f.locator('#app-title').focus(); await demo.p.keyboard.press('Shift+Enter');
        await switchTo(demo, 'portrait'); await switchTo(demo, 'q3mini');
        assert.equal(await demo.f.locator('#demo-modal').isVisible(), true);
        await demo.f.locator('#demo-state').selectOption('parameter-failure');
        await demo.f.locator('#demo-apply').click(); await demo.p.clock.runFor(1000);
        await demo.f.locator('#setup-button').click(); await demo.p.clock.runFor(20000);
        assert.equal(await demo.f.locator('.task-retry:visible').count(), 1);
        await switchTo(demo, 'portrait'); await switchTo(demo, 'q3mini');
        await pinned(demo.f, '#task-done');
        await demo.f.locator('.task-item.error').scrollIntoViewIfNeeded();
        await demo.p.screenshot({ path: `${out}/failed.png` });
        // Controlled layout stress: long names, version strings and failure reasons.
        await demo.f.locator('.task-item.error .task-name').evaluate(el => { el.textContent = 'LongApplicationNameWithoutSpaces'.repeat(5); });
        await demo.f.locator('.task-item.error .task-version').evaluate(el => { el.textContent = '1234567890.'.repeat(12); });
        await demo.f.locator('.task-item.error .task-phase').evaluate(el => { el.textContent = 'Connection unavailable. Please check the network and try again. '.repeat(5); });
        await layout(demo);
        await demo.f.locator('.task-retry:visible').click(); await demo.p.clock.runFor(15000);
        assert.equal(await demo.f.locator('.task-item.success').count(), 4);
        await demo.p.close();
        passed.push('Demo dialog and failed tasks retain state; row Retry remains usable above fixed Done');

        const unknown = await open('unknown');
        assert.equal(await unknown.f.locator('#download-app').isDisabled(), true);
        await unknown.f.locator('#download-parameters').click(); await unknown.p.clock.runFor(1000);
        await pinned(unknown.f, '#task-check-status');
        await switchTo(unknown, 'portrait'); await switchTo(unknown, 'q3mini');
        await unknown.f.locator('#task-check-status').click(); await unknown.p.clock.runFor(1000);
        assert.equal(await unknown.f.locator('#task-done').isVisible(), false);
        await unknown.p.clock.runFor(121000);
        await pinned(unknown.f, '#task-check-status'); await pinned(unknown.f, '#task-back');
        await layout(unknown);
        await unknown.p.close();
        passed.push('Unconfirmed saved job keeps Check status and stalled return accessible without allowing new work');

        for (const width of [320, 390]) {
            const small = await open('configured', 'q3mini', width, 568);
            const box = await small.p.locator('#terminal-preview').boundingBox();
            assert.equal(box.width, box.height);
            await layout(small);
            await small.f.locator('#download-parameters').click(); await small.p.clock.runFor(15000);
            await pinned(small.f, '#task-done'); await layout(small);
            await small.p.screenshot({ path: `${out}/narrow-${width}.png` });
            await small.p.close();
        }
        passed.push('Narrow browser keeps a square preview with accessible task actions and no horizontal overflow');
        assert.deepEqual(errors, []);
        fs.writeFileSync(`${out}/results.json`, JSON.stringify({ passed, errors }, null, 2));
        console.log(JSON.stringify({ passed, errors }, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
