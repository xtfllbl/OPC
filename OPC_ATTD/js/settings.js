// OPC_ATTD: Settings Controller

function readCashRefundSetting() {
    try {
        return localStorage.getItem('cashRefundEnabled') === 'true';
    } catch (error) {
        return false;
    }
}

function readElectronicSignatureSetting() {
    try {
        return localStorage.getItem('electronicSignatureEnabled') === 'true';
    } catch (error) {
        return false;
    }
}

var cashDiscountEnabled = false;
var cashRefundEnabled = readCashRefundSetting();
var electronicSignatureEnabled = readElectronicSignatureSetting();
var cashDiscountPercentText = '';
const SETTINGS_EXIT_PASSWORD = '99999999';

var cashDiscountPage = null;
var cashDiscountToggle = null;
var cashDiscountRateGroup = null;
var cashDiscountInput = null;
var cashDiscountError = null;
var cashDiscountSummary = null;
var cashRefundToggle = null;
var electronicSignatureToggle = null;
var settingsOverlay = null;
var settingsExitModal = null;
var settingsExitPasswordInput = null;
var settingsExitPasswordError = null;

function initSettingsElements() {
    cashDiscountPage = document.getElementById('cash-discount-page');
    cashDiscountToggle = document.getElementById('cash-discount-toggle');
    cashDiscountRateGroup = document.getElementById('cash-discount-rate-group');
    cashDiscountInput = document.getElementById('cash-discount-input');
    cashDiscountError = document.getElementById('cash-discount-error');
    cashDiscountSummary = document.getElementById('cash-discount-summary');
    cashRefundToggle = document.getElementById('cash-refund-toggle');
    electronicSignatureToggle = document.getElementById('electronic-signature-toggle');
    settingsOverlay = document.getElementById('settings-overlay');
    settingsExitModal = document.getElementById('settings-exit-modal');
    settingsExitPasswordInput = document.getElementById('settings-exit-password');
    settingsExitPasswordError = document.getElementById('settings-exit-password-error');
}

        function parseCashDiscountPercent(value) {
            if (value === null || value === undefined) return null;
            const text = String(value).trim();
            if (!text) return null;
            const parsed = Number(text);
            if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return null;
            return Math.round(parsed * 100) / 100;
        }

        function readCashRefundSetting() {
            try {
                return localStorage.getItem('cashRefundEnabled') === 'true';
            } catch (error) {
                return false;
            }
        }

        function updateCashRefundUI() {
            if (!cashRefundToggle) return;
            cashRefundToggle.classList.toggle('on', cashRefundEnabled);
            cashRefundToggle.setAttribute('aria-checked', String(cashRefundEnabled));
        }

        function toggleCashRefundSwitch(event) {
            if (event) event.stopPropagation();
            cashRefundEnabled = !cashRefundEnabled;
            try {
                localStorage.setItem('cashRefundEnabled', String(cashRefundEnabled));
            } catch (error) {
                // The current session can still use the in-memory setting.
            }
            updateCashRefundUI();
        }

        function readElectronicSignatureSetting() {
            try {
                return localStorage.getItem('electronicSignatureEnabled') === 'true';
            } catch (error) {
                return false;
            }
        }

        function updateElectronicSignatureUI() {
            if (!electronicSignatureToggle) return;
            electronicSignatureToggle.classList.toggle('on', electronicSignatureEnabled);
            electronicSignatureToggle.setAttribute('aria-checked', String(electronicSignatureEnabled));
        }

        function toggleElectronicSignatureSwitch(event) {
            if (event) event.stopPropagation();
            electronicSignatureEnabled = !electronicSignatureEnabled;
            try {
                localStorage.setItem('electronicSignatureEnabled', String(electronicSignatureEnabled));
            } catch (error) {
                // The current session can still use the in-memory setting.
            }
            updateElectronicSignatureUI();
        }

        function formatCashDiscountPercent(value) {
            if (!Number.isFinite(value)) return '';
            if (Number.isInteger(value)) return String(value);
            return value.toFixed(2).replace(/\.?0+$/, '');
        }

        function updateCashDiscountUI(options = {}) {
            const preserveInput = !!options.preserveInput;
            const parsedPercent = parseCashDiscountPercent(cashDiscountPercentText);

            if (cashDiscountToggle) {
                cashDiscountToggle.classList.toggle('on', cashDiscountEnabled);
            }
            if (cashDiscountRateGroup) {
                cashDiscountRateGroup.classList.toggle('hidden', !cashDiscountEnabled);
            }
            if (!preserveInput && cashDiscountInput && parsedPercent !== null) {
                cashDiscountInput.value = formatCashDiscountPercent(parsedPercent);
            }

            if (cashDiscountSummary) {
                if (!cashDiscountEnabled) {
                    cashDiscountSummary.textContent = 'OFF';
                } else if (parsedPercent === null) {
                    cashDiscountSummary.textContent = 'SET %';
                } else {
                    cashDiscountSummary.textContent = `${formatCashDiscountPercent(parsedPercent)}%`;
                }
            }

            if (cashDiscountError) {
                if (cashDiscountEnabled && parsedPercent === null) {
                    cashDiscountError.textContent = 'Enter discount percentage (0.01 - 100).';
                    cashDiscountError.classList.add('show');
                } else {
                    cashDiscountError.classList.remove('show');
                }
            }

            window.cashDiscountConfig = {
                enabled: cashDiscountEnabled && parsedPercent !== null,
                percent: parsedPercent
            };
        }

        function openCashDiscountPage() {
            if (!cashDiscountPage) return;
            cashDiscountPage.classList.add('open');
            updateCashDiscountUI();

            const parsedPercent = parseCashDiscountPercent(cashDiscountPercentText);
            if (cashDiscountEnabled && parsedPercent === null && cashDiscountInput) {
                setTimeout(() => cashDiscountInput.focus(), 0);
            }
        }

        function closeCashDiscountPage(e, forceClose = false) {
            if (e) e.stopPropagation();
            if (!cashDiscountPage) return;

            const parsedPercent = parseCashDiscountPercent(cashDiscountPercentText);
            if (!forceClose && cashDiscountEnabled && parsedPercent === null) {
                if (cashDiscountInput) cashDiscountInput.focus();
                updateCashDiscountUI({ preserveInput: true });
                return;
            }

            cashDiscountPage.classList.remove('open');
            updateCashDiscountUI({ preserveInput: true });
        }

        function toggleCashDiscountSwitch(event) {
            if (event) event.stopPropagation();
            cashDiscountEnabled = !cashDiscountEnabled;
            updateCashDiscountUI({ preserveInput: true });

            if (cashDiscountEnabled && parseCashDiscountPercent(cashDiscountPercentText) === null && cashDiscountInput) {
                setTimeout(() => cashDiscountInput.focus(), 0);
            }
        }

        function handleCashDiscountInput(event) {
            cashDiscountPercentText = event.target.value.trim();
            updateCashDiscountUI({ preserveInput: true });
        }

        function normalizeCashDiscountInput() {
            const parsedPercent = parseCashDiscountPercent(cashDiscountPercentText);
            if (parsedPercent !== null) {
                cashDiscountPercentText = formatCashDiscountPercent(parsedPercent);
                if (cashDiscountInput) cashDiscountInput.value = cashDiscountPercentText;
            }
            updateCashDiscountUI({ preserveInput: true });
        }


        function toggleSetting(element) {
            const groupKey = element.dataset.group;
            if (groupKey) {
                const enabled = getEnabledPaymentGroups();
                const isLastEnabled = element.classList.contains('on') && enabled.length === 1;
                if (isLastEnabled) {
                    alert('Keep at least one payment option enabled.');
                    return;
                }
            }

            element.classList.toggle('on');
            if (groupKey) {
                syncPaymentAvailability();
            }
        }


        function openSettings() {
            if (typeof closePrintMenu === 'function') closePrintMenu(null, true);
            closeCashDiscountPage(null, true);
            closeExitPasswordModal(null);
            showAppView('settings');
        }

        function settingsCanRequestExit() {
            const parsedPercent = parseCashDiscountPercent(cashDiscountPercentText);
            if (cashDiscountEnabled && parsedPercent === null) {
                openCashDiscountPage();
                updateCashDiscountUI({ preserveInput: true });
                return false;
            }
            return true;
        }

        function requestSettingsExit(e) {
            if (e) e.stopPropagation();
            if (!settingsCanRequestExit()) return;
            openExitPasswordModal();
        }

        function openExitPasswordModal() {
            if (!settingsExitModal) {
                closeSettings(null);
                return;
            }
            clearExitPasswordError();
            if (settingsExitPasswordInput) settingsExitPasswordInput.value = '';
            settingsExitModal.classList.add('open');
            setTimeout(() => {
                if (settingsExitPasswordInput) settingsExitPasswordInput.focus();
            }, 0);
        }

        function closeExitPasswordModal(e) {
            if (e) e.stopPropagation();
            if (!settingsExitModal) return;
            settingsExitModal.classList.remove('open');
            if (settingsExitPasswordInput) settingsExitPasswordInput.value = '';
            clearExitPasswordError();
        }

        function clearExitPasswordError() {
            if (settingsExitPasswordError) {
                settingsExitPasswordError.classList.remove('show');
            }
        }

        function handleExitPasswordKey(event) {
            if (event.key === 'Enter') {
                confirmSettingsExit(event);
            } else if (event.key === 'Escape') {
                closeExitPasswordModal(event);
            }
        }

        function confirmSettingsExit(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            const enteredPassword = settingsExitPasswordInput ? settingsExitPasswordInput.value : '';
            if (enteredPassword === SETTINGS_EXIT_PASSWORD) {
                closeSettings(null);
                return;
            }

            if (settingsExitPasswordError) {
                settingsExitPasswordError.classList.add('show');
            }
            if (settingsExitPasswordInput) {
                settingsExitPasswordInput.focus();
                settingsExitPasswordInput.select();
            }
        }

        function closeSettings(e, preserveView = false) {
            if (e) e.stopPropagation();
            closeExitPasswordModal(null);
            closeCashDiscountPage(null, true);
            settingsOverlay.classList.remove('open');
            settingsOverlay.setAttribute('aria-hidden', 'true');
            settingsOverlay.setAttribute('inert', '');
            if (!preserveView) showAppView('home');
        }

