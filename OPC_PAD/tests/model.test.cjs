const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/model.js');
const move = M.transition;
const order = (config = {}) => move(M.initial(), { type: 'ORDER', config: { ...M.defaults, ...config }, order: M.makeOrder() });
const choose = method => move(move(order(), { type: 'NO_TIP' }), { type: 'CHOOSE', method });
test('all sample baskets reconcile in integer cents', () => {
  for (const kind of ['regular', 'long', 'single']) {
    const o = M.makeOrder(kind);
    assert.equal(o.subtotal, o.items.reduce((v, i) => v + i.price * i.qty, 0));
    assert.equal(o.total, o.subtotal - o.discount + o.tax);
    assert.ok(Number.isInteger(o.total));
  }
  assert.equal(M.makeOrder().total, 3317);
  assert.equal(M.makeOrder('long').items.length, 18);
});
test('ATTD tip precedes payment selection and dual pricing includes confirmed tip', () => {
  let s = order(); assert.equal(s.phase, 'tip');
  s = move(s, { type: 'SET_TIP', cents: 663 }); assert.equal(s.phase, 'confirmTip');
  assert.equal(s.tip, 0);
  s = move(s, { type: 'CONFIRM_TIP' }); assert.equal(s.phase, 'select');
  assert.equal(M.price(s, 'CASH'), 3980);
  assert.equal(M.price(s, 'CREDIT SALE'), 4139);
  assert.equal(M.price(s, 'DEBIT SALE'), 4139);
  assert.equal(M.price(s, 'WALLET'), 3980);
  assert.equal(move(s, { type: 'EDIT_TIP' }).phase, 'tip');
});
test('custom tip validates amount and no tip clears previous tip', () => {
  const custom = move(order(), { type: 'CUSTOM_TIP' });
  for (const cents of [-1, NaN, 1.2, 1000000]) assert.equal(move(custom, { type: 'SET_TIP', cents }), custom);
  let s = move(move(custom, { type: 'SET_TIP', cents: 1234 }), { type: 'CONFIRM_TIP' });
  assert.equal(M.price(s, 'CASH'), 4551);
  s = move(move(s, { type: 'EDIT_TIP' }), { type: 'NO_TIP' }); assert.equal(s.tip, 0);
});
test('turning off tips and dual pricing uses one price and starts at selection', () => {
  const s = order({ tips: false, dual: false }); assert.equal(s.phase, 'select');
  for (const method of M.methods) assert.equal(M.price(s, method), 3317);
});
test('cash only completes when cashier confirms; wallet has no card states', () => {
  const cash = choose('CASH'); assert.equal(move(cash, { type: 'START' }), cash);
  assert.equal(move(cash, { type: 'APPROVED' }), cash);
  assert.equal(move(cash, { type: 'CASH_RECEIVED' }).phase, 'success');
  const wallet = move(choose('WALLET'), { type: 'START' }); assert.equal(move(wallet, { type: 'APPROVED' }).phase, 'success');
});
test('card wait automatically resolves at 5 seconds and keeps optional credit signature', () => {
  const credit = choose('CREDIT SALE'), step = M.automaticStep(credit);
  assert.equal(step.delay, 5000);
  const signature = move(credit, step.action); assert.equal(signature.phase, 'signature');
  assert.equal(move(signature, { type: 'SIGNED' }).phase, 'success');
  assert.equal(move(choose('DEBIT SALE'), M.automaticStep(choose('DEBIT SALE')).action).phase, 'success');
  const withoutSignature = move(order({ tips: false, signature: false }), { type: 'CHOOSE', method: 'CREDIT SALE' });
  assert.equal(move(withoutSignature, M.automaticStep(withoutSignature).action).phase, 'success');
});
test('card screen rejects manual start and switching; failed card can retry', () => {
  const card = choose('CREDIT SALE');
  for (const action of [{ type: 'BACK' }, { type: 'START' }, { type: 'CHOOSE', method: 'CASH' }, { type: 'ORDER', order: M.makeOrder() }]) assert.equal(move(card, action), card);
  let failed = move(order({ tips: false, response: 'failed' }), { type: 'CHOOSE', method: 'DEBIT SALE' });
  failed = move(failed, M.automaticStep(failed).action); assert.equal(failed.phase, 'failed');
  const retry = move(failed, { type: 'RETRY' }); assert.equal(M.automaticStep(retry).delay, 5000);
  assert.equal(move(failed, { type: 'BACK' }).phase, 'select');
});
test('all result screens return to idle after 10 seconds or OK and clear the order', () => {
  const success = move(choose('CASH'), { type: 'CASH_RECEIVED' });
  const failed = move({ ...choose('DEBIT SALE'), config: { ...M.defaults, response: 'failed' } }, { type: 'CARD_RESULT' });
  const cancelled = move(choose('CASH'), { type: 'CANCEL' });
  for (const result of [success, failed, cancelled]) {
    const step = M.automaticStep(result);
    assert.equal(step.delay, 10000); assert.equal(step.action.type, 'IDLE');
    const pending = move(result, { type: 'LAYOUT', layout: 'right' });
    for (const action of [step.action, { type: 'IDLE' }]) {
      const idle = move(pending, action);
      assert.equal(idle.phase, 'idle'); assert.equal(idle.order, null);
      assert.equal(idle.method, null); assert.equal(idle.tip, 0);
      assert.equal(idle.config.layout, 'right');
    }
  }
  assert.equal(M.automaticStep(choose('WALLET')), null);
  assert.equal(move(choose('CASH'), { type: 'IDLE' }).phase, 'waiting');
});
test('cancelled card ignores stale automatic success; signature cannot be cancelled', () => {
  const card = choose('CREDIT SALE'), result = M.automaticStep(card).action;
  const cancelled = move(card, { type: 'CANCEL' }); assert.equal(move(cancelled, result), cancelled);
  const signature = move(card, result); assert.equal(move(signature, { type: 'CANCEL' }), signature);
});
test('layout is deferred through transaction and cleared on idle', () => {
  let s = move(choose('CASH'), { type: 'LAYOUT', layout: 'right' }); assert.equal(s.config.layout, 'left');
  s = move(move(s, { type: 'CASH_RECEIVED' }), { type: 'IDLE' });
  assert.equal(s.config.layout, 'right'); assert.equal(s.pendingLayout, null); assert.equal(s.order, null);
});
