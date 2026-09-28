(() => {
  const stateKey = 'opc-pad-session-v3', configKey = 'opc-pad-config-v2';
  function read(key, fallback) { try { const data = JSON.parse(localStorage.getItem(key)); return data || fallback; } catch { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  const getConfig = () => PadModel.config(read(configKey, PadModel.defaults));
  window.PadStore = { stateKey, getConfig, setConfig: value => write(configKey, PadModel.config(value)), getState: () => { const s = read(stateKey, null); return s?.config && s?.phase ? s : PadModel.initial(getConfig()); }, setState: value => write(stateKey, value) };
})();
