// OPC_ATTD: Unified POS Main Application Controller
var activeTab = 0;
let receiptNumber = '';

const displayEl = document.getElementById('main-amount');
const amountLabel = document.getElementById('amount-label');
const amountContext = document.getElementById('amount-context');
const amountError = document.getElementById('amount-error');
const entryStage = document.getElementById('entry-stage');
const merchantBrandState = document.getElementById('merchant-brand-state');
const merchantName = document.getElementById('merchant-name');
const merchantLogoSlot = document.getElementById('merchant-logo-slot');
const merchantLogo = document.getElementById('merchant-logo');
const amountEntryState = document.getElementById('amount-entry-state');
const transactionsView = document.getElementById('transactions-view');
const bottomNav = document.querySelector('.bottom-nav');
const bottomNavItems = Array.from(document.querySelectorAll('.bottom-nav-item'));

const printSubmenuSheet = document.getElementById('print-submenu-sheet');
const receiptReprintView = document.getElementById('receipt-reprint-view');
const receiptEntryInput = document.getElementById('receipt-entry-input');
const receiptEntryError = document.getElementById('receipt-entry-error');

const tabPill = document.getElementById('tab-pill');
const tabsContainer = document.querySelector('.tabs');
const tabs = Array.from(document.querySelectorAll('.tab-item'));
const grids = [
    document.getElementById('grid-card'),
    document.getElementById('grid-scan'),
    document.getElementById('grid-loyalty')
];

const tabColors = [
    'var(--color-sale-text)',
    'var(--color-success-text)',
    'var(--color-purple-text)'
];
const tabShadows = [
    'rgba(10, 91, 255, 0.30)',
    'rgba(0, 168, 107, 0.36)',
    'rgba(124, 58, 237, 0.28)'
];

const defaultMerchant = { name: 'Merchant', logo: 'assets/merchant-default.svg', shape: 'round' };
const demoMerchants = [
    { name: 'UNIQLO', logo: 'assets/uniqlo-logo.svg', shape: 'square' },
    { name: 'Target', logo: 'assets/brand-target.svg', shape: 'round' },
    { name: 'IKEA', logo: 'assets/brand-ikea.svg', shape: 'wide' },
    { name: 'Coca-Cola', logo: 'assets/brand-cocacola.svg', shape: 'wordmark' },
    { name: 'Nike', logo: 'assets/brand-nike.svg', shape: 'wordmark' },
    { name: 'Apple', logo: 'assets/brand-apple.svg', shape: 'square' },
    { name: "McDonald's", logo: 'assets/brand-mcdonalds.svg', shape: 'tall' },
    defaultMerchant
];

const actionsRequireFreshAmount = new Set([
    'Sale', 'Auth', 'Auth-Incremental', 'Capture', 'Refund',
    'Tip Adjust', 'Scan QR', 'Show Code', 'Pay', 'Activate', 'Top-up', 'Add Tip'
]);

const paymentGroups = [
    { key: 'card', tab: tabs[0], grid: grids[0], toggle: document.querySelector('.settings-toggle[data-group="card"]') },
    { key: 'qr', tab: tabs[1], grid: grids[1], toggle: document.querySelector('.settings-toggle[data-group="qr"]') },
    { key: 'loyalty', tab: tabs[2], grid: grids[2], toggle: document.querySelector('.settings-toggle[data-group="loyalty"]') }
];

        function renderMerchant(merchant, index) {
            if (!merchantName || !merchantLogoSlot || !merchantLogo) return;
            const resolvedMerchant = merchant && merchant.logo ? merchant : defaultMerchant;
            merchantName.textContent = resolvedMerchant.name || defaultMerchant.name;
            merchantLogo.onerror = resolvedMerchant.logo === 'assets/' + (defaultMerchant.logo.replace('assets/', ''))
                ? null
                : () => renderMerchant(defaultMerchant, -1);
            merchantLogo.src = resolvedMerchant.logo;
            merchantLogo.alt = `${resolvedMerchant.name} merchant logo`;
            merchantLogoSlot.dataset.shape = resolvedMerchant.shape || 'square';
            merchantLogoSlot.setAttribute('aria-label', `${resolvedMerchant.name} merchant logo`);
            merchantLogo.dataset.merchantIndex = String(index);
            if (window.MerchantContext) {
                window.MerchantContext.set(resolvedMerchant);
            }
        }

        function selectRandomMerchantLogo() {
            if (!demoMerchants.length) return;
            let lastIndex = -1;
            try {
                lastIndex = Number.parseInt(sessionStorage.getItem('lastDemoMerchantIndex'), 10);
            } catch (error) {
                lastIndex = -1;
            }

            let nextIndex;
            if (demoMerchants.length === 1 || !Number.isInteger(lastIndex) || lastIndex < 0 || lastIndex >= demoMerchants.length) {
                nextIndex = Math.floor(Math.random() * demoMerchants.length);
            } else {
                const offset = 1 + Math.floor(Math.random() * (demoMerchants.length - 1));
                nextIndex = (lastIndex + offset) % demoMerchants.length;
            }

            renderMerchant(demoMerchants[nextIndex], nextIndex);
            try {
                sessionStorage.setItem('lastDemoMerchantIndex', String(nextIndex));
            } catch (error) {
                // The logo can still rotate when storage is unavailable.
            }
        }

        window.showNextMerchantLogo = function () {
            const currentIndex = Number.parseInt(merchantLogo?.dataset.merchantIndex || '-1', 10);
            const nextIndex = Number.isInteger(currentIndex) && currentIndex >= 0
                ? (currentIndex + 1) % demoMerchants.length
                : 0;
            renderMerchant(demoMerchants[nextIndex], nextIndex);
            try {
                sessionStorage.setItem('lastDemoMerchantIndex', String(nextIndex));
            } catch (error) {
                // The manual preview still works when storage is unavailable.
            }
        };

        window.setMerchantBrand = function (merchant = {}) {
            const uploadedMerchant = merchant.logo
                ? {
                    name: merchant.name || defaultMerchant.name,
                    logo: merchant.logo,
                    shape: merchant.shape || 'square'
                }
                : defaultMerchant;
            renderMerchant(uploadedMerchant, -1);
        };


        function applyTabTheme(index) {
            const rootStyle = document.documentElement.style;
            rootStyle.setProperty('--tab-active-color', tabColors[index] || 'var(--primary)');
            rootStyle.setProperty('--tab-active-shadow', tabShadows[index] || 'rgba(10, 91, 255, 0.3)');
        }

        function getEnabledPaymentGroups() {
            return paymentGroups.filter(group => group.toggle && group.toggle.classList.contains('on'));
        }

        function ensureActiveTabIsVisible() {
            const enabled = getEnabledPaymentGroups();
            if (!enabled.length) return;
            const activeGroup = paymentGroups[activeTab];
            const activeVisible = activeGroup && activeGroup.toggle && activeGroup.toggle.classList.contains('on');
            if (!activeVisible) {
                const fallbackIndex = paymentGroups.findIndex(group => group.toggle && group.toggle.classList.contains('on'));
                activeTab = fallbackIndex === -1 ? 0 : fallbackIndex;
            }
        }

        function renderTabsFromSettings() {
            const enabledGroups = getEnabledPaymentGroups();
            const visibleCount = enabledGroups.length || 1;
            const activeVisibleIndex = enabledGroups.findIndex(group => paymentGroups.indexOf(group) === activeTab);
            const pillIndex = activeVisibleIndex >= 0 ? activeVisibleIndex : 0;
            const cardOnlyEnabled = visibleCount === 1 && enabledGroups[0]?.key === 'card';
            const isSingle = visibleCount === 1 && !cardOnlyEnabled;

            if (tabsContainer) {
                tabsContainer.classList.toggle('card-only-hidden', cardOnlyEnabled);
                tabsContainer.classList.toggle('single-payment', isSingle);
            }

            if (tabPill) {
                if (isSingle || cardOnlyEnabled) {
                    tabPill.style.display = 'none';
                } else {
                    tabPill.style.display = 'block';
                    tabPill.style.width = `calc(${100 / visibleCount}% - 4px)`;
                    tabPill.style.transform = `translateX(${pillIndex * 100}%)`;
                }
            }

            paymentGroups.forEach((group, idx) => {
                const isEnabled = group.toggle && group.toggle.classList.contains('on');
                if (group.tab) {
                    group.tab.style.display = isEnabled ? 'flex' : 'none';
                    group.tab.classList.toggle('active', isEnabled && idx === activeTab);
                }
                if (group.grid) {
                    group.grid.classList.toggle('active', isEnabled && idx === activeTab);
                }
            });

            applyTabTheme(activeTab);
        }

        function syncPaymentAvailability() {
            ensureActiveTabIsVisible();
            renderTabsFromSettings();
            closePrintMenu(null, true);
        }


        function syncBottomNavigationVisibility(activeView = 'home') {
            if (!bottomNav) return;
            const shouldHide = activeView === 'home' && amountInputHasStarted;
            bottomNav.classList.toggle('amount-input-hidden', shouldHide);
            bottomNav.setAttribute('aria-hidden', String(shouldHide));
            bottomNav.toggleAttribute('inert', shouldHide);
        }

        function updateBottomNavigation(activeView) {
            bottomNavItems.forEach((item) => {
                const isActive = item.dataset.view === activeView;
                item.classList.toggle('active', isActive);
                if (isActive) item.setAttribute('aria-current', 'page');
                else item.removeAttribute('aria-current');
            });
        }

        function showSaleHome(e) {
            if (e) e.stopPropagation();
            resetHomeAfterCompletedTransaction();
        }

        function showAppView(viewName, e) {
            if (e) e.stopPropagation();
            window.AttendedFlows?.removeFlow();
            const activeView = ['home', 'transactions', 'settings'].includes(viewName) ? viewName : 'home';

            const batchOverlayEl = document.getElementById('batch-overlay');
            if (batchOverlayEl && batchOverlayEl.classList.contains('open')) {
                if (typeof closeBatchInfoPage === 'function') closeBatchInfoPage(null);
            }
            if (activeView !== 'transactions') {
                closePrintMenu(null, true);
            }

            if (transactionsView) {
                const showTransactions = activeView === 'transactions';
                transactionsView.classList.toggle('open', showTransactions);
                transactionsView.setAttribute('aria-hidden', String(!showTransactions));
                transactionsView.toggleAttribute('inert', !showTransactions);
            }

            if (settingsOverlay) {
                const showSettings = activeView === 'settings';
                settingsOverlay.classList.toggle('open', showSettings);
                settingsOverlay.setAttribute('aria-hidden', String(!showSettings));
                settingsOverlay.toggleAttribute('inert', !showSettings);
                if (showSettings) {
                    if (typeof closeCashDiscountPage === 'function') closeCashDiscountPage(null, true);
                    if (typeof closeExitPasswordModal === 'function') closeExitPasswordModal(null);
                } else {
                    if (typeof closeExitPasswordModal === 'function') closeExitPasswordModal(null);
                    if (typeof closeCashDiscountPage === 'function') closeCashDiscountPage(null, true);
                }
            }

            updateBottomNavigation(activeView);
            syncBottomNavigationVisibility(activeView);
            if (activeView === 'home') updateAmountContext();
        }


        function switchTab(index) {
            const targetGroup = paymentGroups[index];
            if (!targetGroup || !targetGroup.toggle || !targetGroup.toggle.classList.contains('on')) return;
            closePrintMenu(null, true);
            activeTab = index;
            renderTabsFromSettings();
        }

        function openPrintMenu() {
            if (!printSubmenuSheet) return;
            closeReceiptReprint(null);
            printSubmenuSheet.classList.add('open');
        }

        function closePrintMenu(e, forceClose = false) {
            if (e) e.stopPropagation();
            if (!printSubmenuSheet) return;
            if (!forceClose && !printSubmenuSheet.classList.contains('open')) return;
            closeReceiptReprint(null);
            printSubmenuSheet.classList.remove('open');
        }

        function updateReceiptReprintUI() {
            if (receiptEntryInput && receiptEntryInput.value !== receiptNumber) {
                receiptEntryInput.value = receiptNumber;
            }
            if (receiptEntryError) receiptEntryError.textContent = '';
        }

        function openReceiptReprint(e) {
            if (e) e.stopPropagation();
            receiptNumber = '';
            updateReceiptReprintUI();
            if (!receiptReprintView) return;
            receiptReprintView.classList.add('open');
            receiptReprintView.setAttribute('aria-hidden', 'false');
            window.setTimeout(() => {
                if (receiptEntryInput && receiptReprintView.classList.contains('open')) {
                    receiptEntryInput.focus();
                }
            }, 120);
        }

        function closeReceiptReprint(e) {
            if (e) e.stopPropagation();
            if (receiptEntryInput) receiptEntryInput.blur();
            if (receiptReprintView) {
                receiptReprintView.classList.remove('open');
                receiptReprintView.setAttribute('aria-hidden', 'true');
            }
            receiptNumber = '';
            updateReceiptReprintUI();
        }

        function handleReceiptInput(e) {
            const normalizedValue = String(e && e.target ? e.target.value : '')
                .replace(/\D/g, '')
                .slice(0, 32);
            receiptNumber = normalizedValue;
            if (receiptEntryInput && receiptEntryInput.value !== normalizedValue) {
                receiptEntryInput.value = normalizedValue;
            }
            if (receiptEntryError) receiptEntryError.textContent = '';
        }

        function handleReceiptKeydown(e) {
            if (e && e.key === 'Enter') {
                submitReceiptReprint(e);
            }
        }

        async function submitReceiptReprint(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            const receiptNumberIsValid = /^\d+$/.test(receiptNumber);
            if (!receiptNumberIsValid) {
                if (receiptEntryError) {
                    receiptEntryError.textContent = 'Enter a valid Receipt No.';
                }
                if (receiptEntryInput) receiptEntryInput.focus();
                return;
            }

            const receiptNumberToPrint = receiptNumber;
            const methodNames = ['reprintByReceiptNo', 'printReceiptByReceiptNo', 'reprintReceipt'];
            const bridgeNames = [
                'PaywizardTerminal',
                'PayWizardTerminal',
                'paywizardTerminal',
                'TerminalBridge',
                'NativeBridge',
                'Android',
                'android'
            ];

            try {
                let handled = false;
                for (const methodName of methodNames) {
                    if (typeof window[methodName] === 'function') {
                        await window[methodName](receiptNumberToPrint);
                        handled = true;
                        break;
                    }
                }

                if (!handled) {
                    for (const bridgeName of bridgeNames) {
                        const bridge = window[bridgeName];
                        if (!bridge) continue;
                        for (const methodName of methodNames) {
                            if (typeof bridge[methodName] === 'function') {
                                await bridge[methodName](receiptNumberToPrint);
                                handled = true;
                                break;
                            }
                        }
                        if (handled) break;
                    }
                }

                if (!handled) {
                    alert(`Printing receipt ${receiptNumberToPrint}`);
                }
                closePrintMenu(null, true);
                resetHomeAfterCompletedTransaction();
            } catch (error) {
                if (receiptEntryError) {
                    receiptEntryError.textContent = error && error.message
                        ? error.message
                        : 'Unable to print this receipt.';
                }
            }
        }

        function getActionLabel(actionName) {
            if (actionName === 'Auth') return 'PreAuth';
            if (actionName === 'Scan QR') return 'Scan';
            return actionName;
        }

        function startAction(actionName, amountCents = null) {
            const normalizedAmount = amountCents === null
                ? null
                : Math.max(0, parseInt(amountCents, 10) || 0);

            if (window.AttendedFlows?.submit(actionName, normalizedAmount)) return;
            if (actionName === 'Sale') {
                const saleAmount = normalizedAmount === null ? 0 : normalizedAmount;
                localStorage.setItem('cashAmountCents', String(saleAmount));
                localStorage.setItem('amountCents', String(saleAmount));
                localStorage.removeItem('tipCents');
                localStorage.removeItem('tipPercent');
                localStorage.removeItem('totalCents');
                localStorage.removeItem('cashTotalCents');
                const tipParams = new URLSearchParams({
                    cashAmountCents: String(saleAmount),
                    amountCents: String(saleAmount)
                });
                if (window.MerchantContext) window.MerchantContext.appendTo(tipParams);
                window.location.href = `tip.html?${tipParams.toString()}`;
                return;
            }
            if (actionName === 'Refund') {
                const refundAmount = normalizedAmount === null ? 0 : normalizedAmount;
                localStorage.setItem('amountCents', String(refundAmount));
                localStorage.setItem('finalAmountCents', String(refundAmount));
                localStorage.setItem('transactionType', 'refund');

                const refundParams = new URLSearchParams({
                    amount: (refundAmount / 100).toFixed(2),
                    amountCents: String(refundAmount),
                    transactionType: 'refund',
                    currency: 'USD'
                });
                if (window.MerchantContext) window.MerchantContext.appendTo(refundParams);

                if (cashRefundEnabled) {
                    window.location.href = `dual_refund.html?${refundParams.toString()}`;
                    return;
                }

                refundParams.set('paymentMethod', 'card');
                localStorage.setItem('paymentMethod', 'card');
                window.location.href = `receipt.html?${refundParams.toString()}`;
                return;
            }
            const amountSuffix = normalizedAmount === null ? '' : `: $${formatMoney(normalizedAmount)}`;
            alert(`Start ${actionName} flow${amountSuffix}`);
            resetHomeAfterCompletedTransaction();
        }

        function doAction(actionName, pinChecked = false) {
            if (actionName === 'Tip Adjust') { AttendedTip.begin(); return; }
            if (!pinChecked && ['Void', 'Refund', 'Close Batch'].includes(actionName)) {
                AttendedUI.pin(actionName, () => doAction(actionName, true));
                return;
            }
            if (['Void', 'Auth-Incremental', 'Capture', 'Reprint'].includes(actionName)) {
                AttendedFlows.begin(actionName); return;
            }
            if (actionName === 'Close Batch') {
                window.location.href = 'batch_reports.html?mode=close'; return;
            }
            closePrintMenu(null, true);

            if (actionsRequireFreshAmount.has(actionName)) {
                resetTransactionAmount(actionName);
                showAppView('home');
                return;
            }

            // Utility workflows never inherit the amount entered on the Sale home screen.
            resetTransactionAmount(null);

            if (actionName === 'Reports') {
                window.location.href = 'batch_reports.html';
                return;
            }

            if (actionName === 'Reprint') {
                openPrintMenu();
                return;
            }

            if (actionName === 'Transaction') {
                window.location.href = 'transactions.html';
                return;
            }

            startAction(actionName, null);
        }


document.addEventListener('DOMContentLoaded', () => {
    if (typeof initSettingsElements === 'function') initSettingsElements();
    renderTabsFromSettings();
    if (typeof updateCashDiscountUI === 'function') updateCashDiscountUI();
    if (typeof updateCashRefundUI === 'function') updateCashRefundUI();
    if (typeof updateElectronicSignatureUI === 'function') updateElectronicSignatureUI();
    selectRandomMerchantLogo();
    resetTransactionAmount();
    showSaleHome();
});
