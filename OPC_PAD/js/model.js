/* Pure prototype state model. Amounts are integer cents. */
(function (root) {
  'use strict';
  const methods = ['CASH', 'DEBIT SALE', 'CREDIT SALE', 'WALLET'];
  const catalog = [
    ['Organic whole milk', '1 gallon', 649, 1], ['Sourdough bread', 'Freshly baked · 1 loaf', 550, 1],
    ['Free-range eggs', '1 dozen', 725, 1], ['Hass avocados', 'Ready to enjoy', 199, 2],
    ['Fresh strawberries', '1 lb pack', 499, 1], ['Sparkling water', 'Lime · 330 ml', 150, 3],
    ['Greek yogurt', 'Plain · 500 g', 549, 1], ['Baby spinach', 'Organic · 5 oz', 399, 1],
    ['Extra virgin olive oil', 'Cold pressed · 500 ml', 1299, 1], ['Cherry tomatoes', '12 oz pack', 429, 1],
    ['Dark chocolate', '70% cocoa · 100 g', 379, 2], ['Penne pasta', '16 oz', 249, 2],
    ['Roasted almonds', 'Unsalted · 8 oz', 699, 1], ['Orange juice', 'No pulp · 1 liter', 599, 1],
    ['Wildflower honey', '12 oz jar', 849, 1], ['A very special seasonal granola with toasted coconut and dried cranberries', 'Family size · 500 g', 799, 1],
    ['Bananas', '1 bunch', 229, 1], ['Ground coffee', 'Medium roast · 12 oz', 1099, 1]
  ];
  function makeOrder(kind = 'regular', number = 1048) {
    const count = kind === 'long' ? 18 : kind === 'single' ? 1 : 6;
    const items = catalog.slice(0, count).map(([name, detail, price, qty]) => ({ name, detail, price, qty }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = count > 1 ? 200 : 0;
    const tax = Math.round((subtotal - discount) * 0.08);
    return { number, items, subtotal, discount, tax, total: subtotal - discount + tax, quantity: items.reduce((sum, item) => sum + item.qty, 0) };
  }
  const defaults = { size: '1600x720', layout: 'left', dual: true, tips: true, signature: true, response: 'success', entry: 'insert' };
  const isCard = method => ['DEBIT SALE', 'CREDIT SALE'].includes(method);
  function config(value = {}) {
    return { size: value.size === '1920x1200' ? value.size : '1600x720', layout: value.layout === 'right' ? 'right' : 'left', dual: value.dual !== false, tips: value.tips !== false, signature: value.signature !== false, response: value.response === 'failed' ? 'failed' : 'success', entry: value.entry === 'tap' ? 'tap' : 'insert' };
  }
  function initial(options = defaults) { return { phase: 'idle', method: null, order: null, tip: 0, draftTip: 0, config: config(options), pendingLayout: null }; }
  function price(state, method = state.method) {
    const cash = (state.order?.total || 0) + state.tip;
    return isCard(method) && state.config.dual ? Math.round(cash * 1.04) : cash;
  }
  function afterCard(state) { return state.config.signature && state.method === 'CREDIT SALE' ? 'signature' : 'success'; }
  function automaticStep(state) {
    if (state.phase === 'waiting' && isCard(state.method)) return { delay: 5000, action: { type: 'CARD_RESULT' } };
    if (state.phase === 'processing') return { delay: 2000, action: { type: state.config.response === 'failed' ? 'DECLINED' : 'APPROVED' } };
    if (state.phase === 'remove') return { delay: 1200, action: { type: 'REMOVED' } };
    if (['success', 'failed', 'cancelled'].includes(state.phase)) return { delay: 10000, action: { type: 'IDLE' } };
    return null;
  }
  function transition(state, action) {
    const active = !['idle', 'success', 'cancelled'].includes(state.phase);
    switch (action.type) {
      case 'ORDER': return state.phase === 'idle' ? { ...initial(action.config || state.config), phase: config(action.config || state.config).tips ? 'tip' : 'select', order: action.order } : state;
      case 'CUSTOM_TIP': return state.phase === 'tip' ? { ...state, phase: 'customTip' } : state;
      case 'SET_TIP': return ['tip', 'customTip'].includes(state.phase) && Number.isSafeInteger(action.cents) && action.cents >= 0 && action.cents <= 999999 ? { ...state, phase: 'confirmTip', draftTip: action.cents } : state;
      case 'NO_TIP': return state.phase === 'tip' ? { ...state, phase: 'select', tip: 0 } : state;
      case 'CONFIRM_TIP': return state.phase === 'confirmTip' ? { ...state, phase: 'select', tip: state.draftTip } : state;
      case 'EDIT_TIP': return ['customTip', 'confirmTip', 'select'].includes(state.phase) && state.config.tips ? { ...state, phase: 'tip', method: null } : state;
      case 'CHOOSE': return state.phase === 'select' && methods.includes(action.method) ? { ...state, phase: 'waiting', method: action.method } : state;
      case 'BACK': return (state.phase === 'failed' || state.phase === 'waiting' && !isCard(state.method)) ? { ...state, phase: 'select', method: null } : state;
      case 'CARD_RESULT': return state.phase === 'waiting' && isCard(state.method) ? { ...state, phase: state.config.response === 'failed' ? 'failed' : afterCard(state) } : state;
      case 'START': return state.phase === 'waiting' && state.method === 'WALLET' ? { ...state, phase: 'processing' } : state;
      case 'CASH_RECEIVED': return state.phase === 'waiting' && state.method === 'CASH' ? { ...state, phase: 'success' } : state;
      case 'APPROVED': return state.phase === 'processing' ? { ...state, phase: isCard(state.method) ? state.config.entry === 'insert' ? 'remove' : afterCard(state) : 'success' } : state;
      case 'REMOVED': return state.phase === 'remove' ? { ...state, phase: afterCard(state) } : state;
      case 'SIGNED': return state.phase === 'signature' ? { ...state, phase: 'success' } : state;
      case 'DECLINED': return state.phase === 'processing' ? { ...state, phase: 'failed' } : state;
      case 'RETRY': return state.phase === 'failed' ? { ...state, phase: 'waiting' } : state;
      case 'CANCEL': return active && !['remove', 'signature'].includes(state.phase) ? { ...state, phase: 'cancelled' } : state;
      case 'IDLE': return ['success', 'failed', 'cancelled'].includes(state.phase) ? initial({ ...state.config, layout: state.pendingLayout || state.config.layout }) : state;
      case 'LAYOUT': return ['left', 'right'].includes(action.layout) ? state.phase === 'idle' ? { ...state, config: { ...state.config, layout: action.layout }, pendingLayout: null } : { ...state, pendingLayout: action.layout } : state;
      default: return state;
    }
  }
  const api = { methods, makeOrder, initial, transition, price, isCard, config, defaults, automaticStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PadModel = api;
})(typeof window !== 'undefined' ? window : {});
