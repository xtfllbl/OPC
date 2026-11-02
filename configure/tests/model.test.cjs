const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Configuration, DemoGateway, normalizeTci, validTci, SN } = require('../model.js');
const fast = () => Promise.resolve();
async function fixture(scenario = 'unbound', onChange = () => {}) {
    const gateway = new DemoGateway({ wait: fast }); gateway.reset(scenario);
    const model = new Configuration(gateway, onChange); await model.enter();
    return { gateway, model };
}
test('TC + exactly eight digits; rejects truncation and malformed identifiers', () => {
    assert.equal(SN, 'WP6170PQ23000060');
    assert.equal(normalizeTci(' tc12345678 '), '12345678');
    for (const value of ['TC12345678', '12345678']) assert.equal(validTci(value), true);
    for (const value of ['123456789', '1234567', 'TC-12345678', 'abc12345678', '']) assert.equal(validTci(value), false);
});
test('query failure never exposes or permits binding or downloads', async () => {
    const { model, gateway } = await fixture('query-failure');
    assert.equal(model.state.binding, 'error');
    await model.start('setup', '12345678');
    assert.equal(gateway.record.binding, null);
    assert.deepEqual(gateway.record.reads, { apps: 0, parameters: 0 });
});
test('independent downloads are blocked until binding succeeds', async () => {
    const { model, gateway } = await fixture();
    await model.start('apps', '12345678'); await model.start('parameters', '12345678');
    assert.equal(gateway.record.binding, null);
    assert.equal(gateway.record.reads.apps, 0);
});
test('invalid, missing, unassigned, unauthorized and occupied TCI remain unbound', async () => {
    for (const [input, expected] of [['123456789', /8 digits/], ['00000000', /not found/], ['00008888', /store/], ['00007777', /not authorized/], ['00009999', /another terminal/]]) {
        const { model, gateway } = await fixture();
        await model.start('setup', input);
        assert.match(model.state.error, expected);
        assert.equal(model.state.binding, 'unbound'); assert.equal(model.state.busy, false);
        assert.equal(gateway.record.binding, null); assert.equal(gateway.record.reads.apps, 0);
    }
});
test('one action binds, installs and actually applies; includes Installing and Applying', async () => {
    const seen = new Set();
    const { model, gateway } = await fixture('unbound', state => [...state.apps, ...state.parameters].forEach(item => seen.add(item.phase)));
    await model.start('setup', 'TC12345678');
    assert.equal(model.state.tci, 'TC12345678'); assert.equal(model.state.binding, 'bound');
    assert.equal(model.complete, true); assert.equal(model.state.busy, false);
    assert.ok(seen.has('Installing')); assert.ok(seen.has('Applying'));
    assert.ok(model.state.apps.every(item => item.phase === 'Installed'));
    assert.ok(model.state.parameters.every(item => item.phase === 'Applied'));
    assert.equal(gateway.record.reads.parameters, 1);
});
test('application failure blocks parameters; per-item retry preserves success and continues', async () => {
    const { model, gateway } = await fixture('app-failure');
    await model.start('setup');
    assert.equal(gateway.record.reads.parameters, 0); assert.equal(model.state.parameters.length, 0);
    const completed = model.state.apps[0]; const snapshots = JSON.stringify(completed);
    assert.equal(completed.status, 'success'); assert.equal(model.state.apps[1].status, 'error');
    await model.retry('apps', 'payment-app');
    assert.equal(model.state.apps[0], completed); assert.equal(JSON.stringify(completed), snapshots);
    assert.equal(model.complete, true); assert.equal(gateway.record.reads.parameters, 1);
});
test('parameter retry never repeats the successful group, updates fetch a fresh manifest', async () => {
    const { model, gateway } = await fixture('parameter-failure');
    await model.start('setup');
    assert.equal(model.complete, false);
    const successful = model.state.parameters[0], before = JSON.stringify(successful);
    await model.retry('parameters', 'payment-parameters');
    assert.equal(model.state.parameters[0], successful); assert.equal(JSON.stringify(successful), before);
    assert.equal(model.complete, true);
    await model.start('parameters');
    assert.equal(gateway.record.reads.parameters, 2);
    assert.notEqual(model.state.parameters[0], successful); assert.equal(model.complete, true);
});
test('prebound terminals cannot run maintenance until setup finishes; app-only never applies parameters', async () => {
    const { model, gateway } = await fixture('bound');
    await model.start('apps'); await model.start('parameters');
    assert.deepEqual(gateway.record.reads, { apps: 0, parameters: 0 });
    await model.start('setup');
    const before = gateway.record.reads.parameters;
    let appExecution = 0;
    model.onChange = state => { appExecution += state.apps.filter(item => item.status === 'working').length; };
    await model.start('apps');
    assert.equal(appExecution, 0); assert.equal(gateway.record.reads.parameters, before);
    assert.deepEqual(model.state.parameters, []); assert.equal(model.complete, true);
});
test('exit during binding cannot resurrect the closed UI; re-entry queries adapter binding', async () => {
    const { model, gateway } = await fixture();
    let release;
    gateway.wait = () => new Promise(resolve => { release = resolve; });
    const work = model.start('setup', '12345678');
    assert.equal(model.state.busy, true); model.close(); release(); await work;
    assert.equal(model.state.closed, true); assert.equal(model.state.tci, '');
    assert.equal(gateway.record.binding, 'TC12345678'); assert.equal(gateway.record.reads.apps, 0);
    gateway.wait = fast; await model.enter();
    assert.equal(model.state.tci, 'TC12345678'); assert.equal(model.complete, false);
});
test('interrupted application jobs restore as retryable, never as complete', async () => {
    const { model, gateway } = await fixture('bound');
    let stopped = false;
    model.onChange = state => {
        if (!stopped && state.apps.some(item => item.status === 'working')) { stopped = true; model.close(); }
    };
    await model.start('setup');
    model.onChange = () => {};
    await model.enter();
    assert.equal(model.complete, false); assert.equal(model.state.parameters.length, 0);
    assert.ok(model.pending('setup'));
    await model.start('setup');
    assert.equal(model.complete, true); assert.equal(gateway.record.reads.parameters, 1);
});
test('saved state survives a new controller; SWAP clears previous task scope', async () => {
    const { model, gateway } = await fixture('bound'); await model.start('setup');
    const reopened = new Configuration(gateway); await reopened.enter(); assert.equal(reopened.complete, true);
    gateway.reset('swap'); await reopened.enter();
    assert.equal(reopened.state.tci, 'TC00004321'); assert.equal(reopened.complete, false);
    assert.deepEqual(reopened.state.apps, []); assert.deepEqual(reopened.state.parameters, []);
});
test('repeated clicks during provisioning do not start duplicate manifests', async () => {
    const { model, gateway } = await fixture();
    await Promise.all([model.start('setup', '12345678'), model.start('setup', '12345678')]);
    assert.deepEqual(gateway.record.reads, { apps: 1, parameters: 1 });
});

test('maintenance failure preserves initial completion and resumes only unsuccessful items', async () => {
    const { model, gateway } = await fixture('maintenance-failure');
    assert.equal(model.complete, true);
    await model.start('parameters');
    assert.equal(model.state.taskStatus, 'failed'); assert.equal(model.complete, true);
    const successful = JSON.stringify(model.state.parameters[0]);
    model.close(); await model.enter();
    assert.equal(model.state.page, 'home'); assert.equal(model.complete, true);
    assert.ok(model.pending('parameters'));
    await model.start('parameters');
    assert.equal(JSON.stringify(model.state.parameters[0]), successful);
    assert.equal(gateway.record.reads.parameters, 1); assert.equal(model.pending('parameters'), null);
});
test('another maintenance operation does not erase pending parameter work', async () => {
    const { model, gateway } = await fixture('maintenance-failure');
    await model.start('parameters'); model.goHome();
    await model.start('apps'); assert.ok(model.pending('parameters'));
    await model.start('parameters'); assert.equal(gateway.record.reads.parameters, 1);
    assert.equal(model.pending('parameters'), null);
});
test('return is blocked while running and completion stays on task page until Done', async () => {
    let attempted = false;
    const { model } = await fixture('bound');
    model.onChange = state => {
        if (state.page === 'task' && state.busy && !attempted) {
            attempted = true; assert.equal(model.goHome(), false); assert.equal(state.page, 'task');
        }
    };
    await model.start('setup'); assert.equal(attempted, true);
    assert.equal(model.state.page, 'task'); assert.equal(model.goHome(), true);
    assert.equal(model.state.page, 'home');
});
test('binding revision invalidates completion and pending records even for the same TCI', async () => {
    const { model, gateway } = await fixture('configured');
    gateway.record.bindingRevision++;
    await model.enter(); assert.equal(model.complete, false); assert.equal(model.pending('setup'), null);
});
test('interruption before app manifest returns retains a resumable setup', async () => {
    const { model, gateway } = await fixture('bound');
    let release; gateway.wait = () => new Promise(resolve => { release = resolve; });
    const work = model.start('setup'); model.close(); release(); await work;
    gateway.wait = fast; await model.enter(); assert.ok(model.pending('setup'));
    await model.start('setup'); assert.equal(model.complete, true);
});
test('manifest failures can resume without repeating installed apps', async () => {
    const { model, gateway } = await fixture('bound');
    const manifest = gateway.manifest.bind(gateway);
    let failed = false;
    gateway.manifest = async type => { if (type === 'parameters' && !failed) { failed = true; throw new Error('Manifest unavailable'); } return manifest(type); };
    await model.start('setup'); assert.match(model.state.error, /unavailable/);
    assert.ok(model.state.apps.every(item => item.status === 'success'));
    await model.start('setup'); assert.equal(model.complete, true);
    assert.equal(gateway.record.reads.apps, 1);
});
