(() => {
  const $ = selector => document.querySelector(selector);
  function getConfig() { return { size: $('#device-size').value, layout: $('#layout').value, dual: $('#dual').checked, tips: $('#tips').checked, signature: $('#signature').checked, response: $('#response').value }; }
  const config = PadStore.getConfig();
  $('#device-size').value = config.size; $('#layout').value = config.layout; $('#response').value = config.response;
  for (const key of ['dual', 'tips', 'signature']) $('#' + key).checked = config[key];
  function render() {
    const s = PadStore.getState();
    $('#current-status').textContent = s.order ? `#${s.order.number} · ${s.method || 'SALE'} · ${s.phase.toUpperCase()}` : 'READY';
    $('#send-order').disabled = s.phase !== 'idle';
    $('#confirm-cash').disabled = !(s.phase === 'waiting' && s.method === 'CASH');
    $('#cancel-order').disabled = !['tip', 'customTip', 'confirmTip', 'select', 'waiting', 'processing', 'failed'].includes(s.phase);
  }
  let customerWindow;
  function openCustomerDisplay(focus = false) {
    if (!customerWindow || customerWindow.closed) {
      customerWindow = window.open('', 'opc-pad-customer');
      if (!customerWindow) {
        $('#display-status').textContent = 'Allow pop-ups to open the customer display, then try again.';
        return false;
      }
      if (customerWindow.location.href === 'about:blank') customerWindow.location.replace('index.html');
    }
    $('#display-status').textContent = '';
    if (focus) customerWindow.focus();
    return true;
  }
  $('#open-display').onclick = event => { event.preventDefault(); openCustomerDisplay(true); };
  function command(action) { PadStore.setState(PadModel.transition(PadStore.getState(), action)); render(); }
  $('#send-order').onclick = () => { if (!openCustomerDisplay()) return; const options = getConfig(); PadStore.setConfig(options); command({ type: 'ORDER', config: options, order: PadModel.makeOrder($('#sample-order').value, String(Date.now()).slice(-6)) }); };
  $('#confirm-cash').onclick = () => command({ type: 'CASH_RECEIVED' });
  $('#cancel-order').onclick = () => command({ type: 'CANCEL' });
  $('#save-settings').onclick = () => {
    const options = getConfig(), state = PadStore.getState();
    const saved = PadStore.setConfig(options);
    PadStore.setState(state.phase === 'idle' ? PadModel.initial(options) : PadModel.transition(state, { type: 'LAYOUT', layout: options.layout }));
    $('#settings-status').textContent = !saved ? 'Browser storage unavailable.' : state.phase === 'idle' ? 'Settings saved.' : 'Layout applies when idle. Other settings apply to the next transaction.';
    render();
  };
  window.addEventListener('storage', event => { if (event.key === PadStore.stateKey) render(); });
  window.addEventListener('pageshow', render); render();
})();
