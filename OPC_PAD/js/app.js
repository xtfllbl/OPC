(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const money = cents => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  let state = PadStore.getState(), phaseTimer, countdownTimer, adTimer, customDigits = '', signed = false, adIndex = 0, renderedOrder;
  const assets = ['market.jpg', 'coffee.jpg', 'bakery.jpg'];
  const glyphs = { check: '<path d="m5 12 5 5L20 7"/>', cross: '<path d="m6 6 12 12M6 18 18 6"/>', cash: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/>', wallet: '<path d="M20 7V4H6a3 3 0 0 0 0 6h15v11H6a3 3 0 0 1-3-3V7M21 12h-6v5h6"/>', remove: '<rect x="4" y="3" width="16" height="10" rx="2"/><path d="M12 8v13m-4-4 4 4 4-4"/>' };
  const icon = key => `<svg viewBox="0 0 24 24" aria-hidden="true">${glyphs[key] || glyphs.check}</svg>`;
  function fit() {
    const [width, height] = state.config.size.split('x').map(Number);
    const scale = Math.min(1, Math.max(.1, (innerWidth - 64) / width), Math.max(.1, (innerHeight - 64) / height));
    $('#device-wrap').style.width = width * scale + 'px'; $('#device-wrap').style.height = height * scale + 'px';
    $('#device').style.transform = `scale(${scale})`;
  }
  function save() { PadStore.setState(state); }
  function schedule() {
    clearTimeout(phaseTimer); clearInterval(countdownTimer); clearInterval(adTimer);
    const step = PadModel.automaticStep(state);
    if (step) {
      phaseTimer = setTimeout(() => dispatch(step.action), step.delay);
      if (step.action.type === 'IDLE') {
        const deadline = Date.now() + step.delay;
        const updateCountdown = () => {
          const button = $('[data-countdown]');
          if (button) button.textContent = `OK(${Math.max(0, Math.ceil((deadline - Date.now()) / 1000))}s)`;
        };
        updateCountdown(); countdownTimer = setInterval(updateCountdown, 200);
      }
    }
    if (state.phase === 'idle') adTimer = setInterval(() => { adIndex = (adIndex + 1) % assets.length; $('#ad-image').src = 'assets/' + assets[adIndex]; document.querySelectorAll('.ad-dots i').forEach((el, i) => el.classList.toggle('active', i === adIndex)); }, 6000);
  }
  function dispatch(action) {
    const next = PadModel.transition(state, action);
    if (next === state) return;
    state = next; signed = false; customDigits = ''; save(); render(); schedule();
  }
  function heading(text) { return `<h1 class="section-title">${text}</h1>`; }
  function amount(value, label = 'Transaction Amount', context = 'SALE') { return `<div class="amount-section"><div class="amount-context">${context}</div><div class="amount-label">${label}</div><div class="hero-amount">${money(value)}</div></div>`; }
  function methodScreen() {
    const types = [{ label: 'DEBIT SALE', type: 'card-card' }, { label: 'CREDIT SALE', type: 'card-card' }, { label: 'CASH', type: 'cash-card' }, { label: 'WALLET', type: 'wallet-card' }];
    return '<div class="selection-merchant">Merchant</div>' + heading('SELECT PAYMENT METHOD') + `<div class="payment-options">${types.map(m => `<button class="option-card ${m.type}" data-method="${m.label}" aria-label="${m.label} ${money(PadModel.price(state, m.label))}"><span class="option-name">${m.label}</span><strong class="option-amount">${money(PadModel.price(state, m.label))}</strong></button>`).join('')}</div>${state.config.tips ? '<button class="btn change-tip" data-action="EDIT_TIP">Change Tip</button>' : ''}`;
  }
  function tipScreen() {
    return amount(state.order.total) + heading('ADD A TIP') + `<div class="tip-grid">${[15, 20, 22, 25].map(p => `<button class="tip-card" data-tip="${Math.round(state.order.total * p / 100)}" aria-label="${p}% tip"><strong>${p}%</strong><span>${money(Math.round(state.order.total * p / 100))}</span></button>`).join('')}</div><div class="actions"><button class="btn primary" data-action="CUSTOM_TIP">Custom Tip</button><button class="btn" data-action="NO_TIP">No Tip</button></div>`;
  }
  function customScreen() {
    return '<button class="back-circle" data-action="EDIT_TIP" aria-label="Back to tip selection">‹</button>' + heading('CUSTOM TIP') + '<div class="custom-readout" id="custom-readout">$0.00</div><div class="key-grid">' + ['7', '8', '9', 'BS', '4', '5', '6', 'C', '1', '2', '3', 'OK', '0', '00'].map(k => `<button class="key" data-key="${k}" aria-label="${k === 'BS' ? 'Delete last digit' : k === 'C' ? 'Clear tip' : k}">${k === 'BS' ? '⌫' : k}</button>`).join('') + '</div>';
  }
  function confirmScreen() {
    return amount(state.order.total + state.draftTip, 'Total Amount') + heading('CONFIRM TIP') + `<div class="confirm-summary"><div><span>Transaction</span><strong>${money(state.order.total)}</strong></div><div><span>Tip</span><strong>${money(state.draftTip)}</strong></div></div><div class="actions"><button class="btn" data-action="EDIT_TIP">Change</button><button class="btn primary" data-action="CONFIRM_TIP">Confirm</button></div>`;
  }
  function successContent() {
    const identity = PadModel.isCard(state.method)
      ? '<img src="assets/icon_visa.svg" alt="Visa"><span>•••• 0100</span>'
      : `<span class="receipt-method-icon" aria-hidden="true">${icon(state.method === 'CASH' ? 'cash' : 'wallet')}</span><span>${state.method}</span>`;
    return `<section class="success-screen" aria-label="Payment approved"><div class="success-summary"><svg class="success-check" viewBox="0 0 48 48" role="img" aria-label="Approved"><circle cx="24" cy="24" r="20"/><path d="m14.5 24.5 6.3 6.3 13-14"/></svg><h1 class="amount-context">SALE</h1><div class="hero-amount">${money(PadModel.price(state))}</div></div><div class="receipt-details" aria-label="Payment reference"><div class="receipt-identity">${identity}</div><div class="receipt-reference"><span>TRANS</span><strong>${state.order.number}</strong></div></div><button class="btn result-action" data-action="IDLE" data-countdown>OK(10s)</button></section>`;
  }
  function unsuccessfulContent() {
    const cancelled = state.phase === 'cancelled';
    return `<div class="transaction-result ${cancelled ? 'result-cancelled' : 'result-failed'}"><div class="result-summary"><svg class="result-cross" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20"/><path d="m17 17 14 14 M31 17 17 31"/></svg><div class="amount-context">${state.method || 'SALE'}</div><div class="hero-amount">${money(PadModel.price(state))}</div></div><div class="result-divider" aria-hidden="true"></div><div class="result-copy" role="status"><h1>Transaction ${cancelled ? 'Cancelled' : 'Failed'}</h1>${cancelled ? '' : '<p>Declined</p>'}</div><button class="btn result-action" data-action="IDLE" data-countdown>OK(10s)</button></div>`;
  }
  function flowScreen() {
    if (state.phase === 'signature') return amount(PadModel.price(state), 'Total Amount') + heading('SIGNATURE') + '<div class="signature-area"><canvas id="signature" width="800" height="260" aria-label="Signature pad"></canvas><span class="signature-placeholder">Sign here</span></div><div class="signature-buttons"><button class="btn" id="clear-signature" disabled>Clear</button><button class="btn primary" id="confirm-signature" disabled>Confirm</button></div>';
    if (state.phase === 'success') return successContent();
    if (['failed', 'cancelled'].includes(state.phase)) return unsuccessfulContent();
    if (state.phase === 'waiting' && PadModel.isCard(state.method)) return `<div class="tap-screen"><h1>TAP CARD</h1><img class="tap-symbol" src="assets/tap.svg" alt="Tap your card"><div class="tap-amount">${money(PadModel.price(state))}</div><div class="card-brands" aria-label="Accepted cards"><img src="assets/visa.svg" alt="Visa"><img src="assets/mastercard.svg" alt="Mastercard"><img src="assets/amex.svg" alt="American Express"><img src="assets/Interac.png" alt="Interac"></div></div>`;
    const cash = state.method === 'CASH', wallet = state.method === 'WALLET';
    let title = cash ? 'PLEASE PAY THE CASHIER' : wallet ? 'WALLET PAYMENT' : 'PRESENT CARD';
    let symbol = cash ? icon('cash') : wallet ? icon('wallet') : '<img src="assets/tap.svg" alt="Present card">';
    let controls = cash ? '<p>Waiting for cashier confirmation</p>' : wallet ? '<button class="btn primary" data-action="START">Pay</button>' : '';
    let back = '<button class="small-action" data-action="BACK">Change Payment Method</button>';
    if (state.phase === 'processing') { title = 'PROCESSING'; symbol = '<span class="spinner"></span>'; controls = '<p>Please wait</p>'; back = ''; }
    if (state.phase === 'remove') { title = 'REMOVE CARD'; symbol = icon('remove'); controls = ''; back = ''; }
    return `<div class="flow ${state.phase} ${cash ? 'cash' : ''}"><div class="amount-context">${state.method || 'SALE'}</div><div class="hero-amount">${money(PadModel.price(state))}</div><div class="flow-icon">${symbol}</div><h1>${title}</h1>${controls}${back}</div>`;
  }
  function renderOrder() {
    const order = state.order;
    if (!order) { renderedOrder = null; return; }
    $('#order-reference').textContent = `#${order.number} · ${order.quantity} ITEMS`;
    if (renderedOrder !== order.number) {
      $('#items').innerHTML = order.items.map(item => `<div class="item-row"><span class="item-name">${item.name}</span><span class="qty">${item.qty}</span><span class="unit">${money(item.price)}</span><span class="line-total">${money(item.price * item.qty)}</span></div>`).join('');
      $('#items').scrollTop = 0; renderedOrder = order.number;
    }
    const tip = state.phase === 'confirmTip' ? state.draftTip : state.tip;
    const cash = order.total + tip;
    const selected = state.method;
    const priceDelta = selected && PadModel.isCard(selected) ? PadModel.price(state) - cash : 0;
    $('#order-summary').innerHTML = `<div class="summary-line"><span>Subtotal</span><span>${money(order.subtotal)}</span></div><div class="summary-line discount"><span>Discount</span><span>−${money(order.discount)}</span></div><div class="summary-line"><span>Tax</span><span>${money(order.tax)}</span></div>${state.config.tips ? `<div class="summary-line"><span>Tip</span><span>${money(tip)}</span></div>` : ''}${priceDelta ? `<div class="summary-line"><span>Card Price Adjustment</span><span>${money(priceDelta)}</span></div>` : ''}<div class="summary-total"><span>Total</span><strong>${money(selected ? PadModel.price(state) : cash)}</strong></div>`;
  }
  function render() {
    $('#device').dataset.size = state.config.size;
    $('#device').dataset.phase = state.phase;
    $('#device').classList.toggle('reversed', state.config.layout === 'right'); fit();
    const idle = state.phase === 'idle'; $('#advertising').hidden = !idle; $('#order').hidden = idle;
    const view = idle ? '<div class="idle-content"><div class="merchant-name">Merchant</div><img class="merchant-logo" src="assets/merchant-default.svg" alt="Merchant logo"><h1 class="section-title">WELCOME</h1></div>' : state.phase === 'tip' ? tipScreen() : state.phase === 'customTip' ? customScreen() : state.phase === 'confirmTip' ? confirmScreen() : state.phase === 'select' ? methodScreen() : flowScreen();
    $('#payment-content').innerHTML = view; renderOrder();
    if (state.phase === 'signature') bindSignature();
  }
  function bindSignature() {
    const canvas = $('#signature'), context = canvas.getContext('2d');
    context.strokeStyle = '#24456D'; context.fillStyle = '#24456D'; context.lineWidth = 3; context.lineCap = 'round'; context.lineJoin = 'round';
    let drawing = false;
    const point = event => { const r = canvas.getBoundingClientRect(); return { x: (event.clientX - r.left) * canvas.width / r.width, y: (event.clientY - r.top) * canvas.height / r.height }; };
    canvas.addEventListener('pointerdown', event => { drawing = true; canvas.setPointerCapture(event.pointerId); const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); context.arc(p.x, p.y, 1.5, 0, Math.PI * 2); context.fill(); signed = true; $('.signature-area').classList.add('signed'); $('#clear-signature').disabled = false; $('#confirm-signature').disabled = false; });
    canvas.addEventListener('pointermove', event => { if (!drawing) return; const p = point(event); context.lineTo(p.x, p.y); context.stroke(); });
    for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { drawing = false; });
    $('#clear-signature').onclick = () => { context.clearRect(0, 0, canvas.width, canvas.height); signed = false; $('.signature-area').classList.remove('signed'); $('#clear-signature').disabled = true; $('#confirm-signature').disabled = true; };
    $('#confirm-signature').onclick = () => { if (signed) dispatch({ type: 'SIGNED' }); };
  }
  $('#payment-content').addEventListener('click', event => {
    const method = event.target.closest('[data-method]'), action = event.target.closest('[data-action]'), tip = event.target.closest('[data-tip]'), key = event.target.closest('[data-key]');
    if (method) dispatch({ type: 'CHOOSE', method: method.dataset.method });
    if (action) dispatch({ type: action.dataset.action });
    if (tip) dispatch({ type: 'SET_TIP', cents: Number(tip.dataset.tip) });
    if (key) {
      const value = key.dataset.key;
      if (value === 'OK') { dispatch({ type: 'SET_TIP', cents: Number(customDigits || 0) }); return; }
      if (value === 'BS') customDigits = customDigits.slice(0, -1);
      else if (value === 'C') customDigits = '';
      else customDigits = (customDigits + value).replace(/^0+/, '').slice(0, 6);
      $('#custom-readout').textContent = money(Number(customDigits || 0));
    }
  });
  window.addEventListener('resize', fit);
  window.addEventListener('storage', event => { if (event.key === PadStore.stateKey) { state = PadStore.getState(); render(); schedule(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) { state = PadStore.getState(); render(); schedule(); } });
  render(); schedule();
})();
