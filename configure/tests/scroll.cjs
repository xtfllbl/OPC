// Real demo flow plus controlled state/gesture edge cases; no production test hooks.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.CONFIGURE_TEST_URL || 'http://127.0.0.1:8765/27.Paywizard_config.html';
const out = '.impeccable/review/configure-task-follow';
fs.mkdirSync(out, { recursive: true });

(async () => {
    const browser = await chromium.launch({ headless: true });
    const errors = [], passed = [];
    async function open(model, width, height, reducedMotion = 'reduce', scenario = 'bound') {
        const p = await browser.newPage({ viewport: { width, height }, reducedMotion });
        p.on('pageerror', error => errors.push(error.message));
        await p.route('**/configure/model.js', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, body: await response.text() + `
                window.ConfigureModel.Configuration = class extends window.ConfigureModel.Configuration {
                    constructor(...args) { super(...args); window.testController = this; }
                };` });
        });
        await p.clock.install();
        const url = new URL(base);
        url.searchParams.set('view', 'terminal');
        url.searchParams.set('model', model);
        url.searchParams.set('scenario', scenario);
        await p.goto(url.href);
        await p.clock.runFor(800);
        await p.evaluate(() => {
            window.scrollCalls = [];
            const main = document.getElementById('main-content');
            const original = main.scrollTo.bind(main);
            main.scrollTo = options => { window.scrollCalls.push(options); original(options); };
        });
        return p;
    }
    async function visible(p, selector, whole = true) {
        const bounds = await p.locator(selector).evaluate(el => {
            const row = el.getBoundingClientRect(), main = document.getElementById('main-content').getBoundingClientRect();
            return { top: row.top, bottom: row.bottom, viewportTop: main.top, viewportBottom: main.bottom };
        });
        assert.ok(bounds.top >= bounds.viewportTop - 1, JSON.stringify(bounds));
        if (whole && bounds.bottom - bounds.top <= bounds.viewportBottom - bounds.viewportTop - 16) {
            assert.ok(bounds.bottom <= bounds.viewportBottom + 1, JSON.stringify(bounds));
        }
    }
    async function fixture(p, options = {}) {
        await p.evaluate(options => {
            const c = window.testController;
            const apps = Array.from({ length: 7 }, (_, i) => ({ id: 'fixture-' + i, name: 'Application ' + (i + 1), version: '1.0',
                phase: i < 5 ? 'Installed' : 'Downloading', progress: i < 5 ? 100 : 28, status: i < 5 ? 'success' : 'working' }));
            Object.assign(c.state, { page: 'task', operation: 'setup', stage: 'apps', taskStatus: 'running', busy: true, apps, parameters: [], error: '', ...options });
            c.emit();
        }, options);
        await p.clock.runFor(250);
    }
    async function scrollTop(p) { return p.locator('main').evaluate(el => el.scrollTop); }
    async function count(p) { return p.evaluate(() => window.scrollCalls.length); }
    try {
        for (const [model, width, height] of [['portrait', 390, 844], ['q3mini', 480, 480], ['portrait', 320, 568], ['q3mini', 320, 320]]) {
            const p = await open(model, width, height);
            // Actual first setup: parallel applications, then parallel parameters.
            await p.locator('#setup-button').click();
            await p.clock.runFor(900);
            assert.equal(await p.locator('.task-item.working').count(), 2);
            await visible(p, '.task-item.working:first-of-type');
            await p.clock.runFor(5600);
            assert.equal(await p.locator('#parameter-task-list .working').count(), 2);
            await visible(p, '#parameter-task-list .working:first-child');
            await p.clock.runFor(3600);
            for (let i = 0; i < 10 && await p.locator('#parameter-task-list .working').count() === 2; i++) await p.clock.runFor(200);
            await visible(p, '#parameter-task-list .working');
            await p.screenshot({ path: `${out}/${model}-${width}-running.png` });
            await p.clock.runFor(2000);
            assert.equal(await p.locator('.task-item.success').count(), 4);

            await fixture(p);
            await visible(p, '[data-task-id="fixture-5"]');
            const stable = await count(p);
            await p.evaluate(() => {
                const c = window.testController;
                c.state.apps[6].progress = 80; c.emit();
                c.state.apps[5].progress = 64; c.emit();
            });
            await p.clock.runFor(250);
            assert.equal(await count(p), stable, 'Parallel progress must not alternate or re-scroll');

            await p.locator('main').dispatchEvent('wheel', { deltaY: -800 });
            await p.locator('main').evaluate(el => { el.scrollTop = 0; });
            await p.clock.runFor(300);
            await p.evaluate(() => { window.testController.state.apps[5].progress = 80; window.testController.emit(); });
            await p.clock.runFor(250);
            assert.equal(await scrollTop(p), 0, 'Progress must respect manual reading');

            await p.locator('main').dispatchEvent('pointerdown', { pointerId: 9 });
            await p.evaluate(() => { window.testController.state.apps[5].status = 'success'; window.testController.emit(); });
            await p.clock.runFor(300);
            assert.equal(await scrollTop(p), 0, 'Do not move while a gesture is held');
            await p.locator('main').dispatchEvent('pointerup', { pointerId: 9 });
            await p.clock.runFor(400);
            await visible(p, '[data-task-id="fixture-6"]');

            // End failure: reveal reason and Retry, without transferring keyboard focus.
            const focus = await p.evaluate(() => document.activeElement.id);
            await p.evaluate(() => {
                const c = window.testController;
                Object.assign(c.state.apps[1], { status: 'error', phase: 'Connection lost. Check the network and retry.' });
                c.state.apps[6].status = 'success'; c.state.busy = false; c.state.taskStatus = 'failed'; c.emit();
            });
            await p.clock.runFor(300);
            await visible(p, '[data-task-id="fixture-1"]');
            assert.equal(await p.evaluate(() => document.activeElement.id), focus);
            await p.screenshot({ path: `${out}/${model}-${width}-failed.png` });
            const failedTop = await scrollTop(p), endedCalls = await count(p);
            await p.evaluate(() => { const c = window.testController; c.state.apps[1].status = 'success'; c.state.taskStatus = 'success'; c.emit(); });
            await p.clock.runFor(300);
            assert.equal(await scrollTop(p), failedTop, 'Success retains the reading position');
            assert.equal(await count(p), endedCalls);

            // Unknown saved runs must not be treated as live work.
            await p.locator('main').evaluate(el => { el.scrollTop = 0; });
            await fixture(p, { taskStatus: 'unknown' });
            assert.equal(await scrollTop(p), 0);
            // An oversized task starts at its name; subsequent updates do not pin it.
            await fixture(p);
            await p.evaluate(() => {
                const c = window.testController;
                c.state.apps[5].status = 'success'; c.state.apps[6].name = 'Long application name '.repeat(90); c.emit();
            });
            await p.clock.runFor(300);
            await visible(p, '[data-task-id="fixture-6"]', false);
            assert.equal(await p.evaluate(() => scrollY), 0);
            assert.equal(await p.evaluate(() => window.scrollCalls.every(call => call.behavior === 'instant')), true);
            await p.close();
            passed.push(`${model} ${width}×${height}: real setup, concurrent target, manual/gesture, failure, success, unknown, long row`);
        }
        {
            const p = await open('q3mini', 480, 480, 'reduce', 'parameter-failure');
            await p.locator('#setup-button').click();
            for (let i = 0; i < 80 && !await p.locator('#task-done').isVisible(); i++) await p.clock.runFor(250);
            assert.equal(await p.locator('.task-item.error').count(), 1);
            await visible(p, '.task-item.error');
            await p.locator('.task-item.error .task-retry').click();
            await p.clock.runFor(1000);
            await visible(p, '#parameter-task-list .working');
            for (let i = 0; i < 40 && !await p.locator('#task-done').isVisible(); i++) await p.clock.runFor(250);
            assert.equal(await p.locator('.task-item.success').count(), 4);
            assert.equal(await p.locator('.task-item.error').count(), 0);

            await fixture(p);
            await p.evaluate(() => parent.postMessage({ type: 'configure-preview-model', model: 'portrait' }, location.origin));
            await p.setViewportSize({ width: 390, height: 844 });
            await p.waitForTimeout(50); // Native ResizeObserver delivery is outside the virtual clock.
            await p.clock.runFor(300);
            await visible(p, '[data-task-id="fixture-5"]');
            await p.evaluate(() => parent.postMessage({ type: 'configure-preview-model', model: 'q3mini' }, location.origin));
            await p.setViewportSize({ width: 320, height: 320 });
            await p.waitForTimeout(50);
            await p.clock.runFor(300);
            await visible(p, '[data-task-id="fixture-5"]');
            assert.equal(await p.locator('html').getAttribute('data-model'), 'q3mini');

            // A failed row must not displace still-running work; global errors expose Retry.
            await p.evaluate(() => {
                const c = window.testController;
                c.state.apps[1].status = 'error'; c.emit();
            });
            await p.clock.runFor(300);
            await visible(p, '[data-task-id="fixture-5"]');
            await p.evaluate(() => {
                const c = window.testController;
                c.state.apps.forEach(item => { item.status = 'success'; });
                c.state.busy = false; c.state.error = 'Couldn’t check installed applications. Try again.';
                c.state.taskStatus = 'failed'; c.emit();
            });
            await p.clock.runFor(300);
            await visible(p, '#task-error');
            await p.close();
            passed.push('Actual parameter failure/retry, live model resizing, running-before-error priority, global error');
        }
        {
            const p = await open('q3mini', 480, 480, 'no-preference');
            await fixture(p);
            await p.clock.resume();
            await p.waitForFunction(() => {
                const row = document.querySelector('[data-task-id="fixture-5"]').getBoundingClientRect();
                const main = document.querySelector('main').getBoundingClientRect();
                return row.top >= main.top && row.bottom <= main.bottom;
            });
            assert.equal(await p.evaluate(() => window.scrollCalls.some(call => call.behavior === 'smooth')), true);
            const box = await p.locator('main').boundingBox();
            await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await p.mouse.wheel(0, -2000);
            await p.waitForFunction(() => document.querySelector('main').scrollTop === 0);
            await p.evaluate(() => { window.testController.state.apps[5].progress = 64; window.testController.emit(); });
            await p.waitForTimeout(250);
            assert.equal(await scrollTop(p), 0);
            await p.close();
            passed.push('Normal-motion smooth scrolling and real wheel interruption');
        }
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ passed, errors }, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
