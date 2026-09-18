// OPC_ATTD: Numeric Keypad & Amount Entry Controller
var rawAmount = '0';
var amountInputHasStarted = false;
var pendingAction = null;
var entryThemeIndex = 0;

const transactionStorageKeys = [
    'cashAmountCents',
    'amountCents',
    'tipCents',
    'tipPercent',
    'totalCents',
    'cashTotalCents',
    'paymentMethod',
    'finalAmountCents',
    'cashPaidCents',
    'cashChangeCents',
    'transactionType',
    'customerReceiptMethod'
];

const entryColors = ['#0A5BFF', '#00A86B', '#7C3AED'];
const entryShadows = [
    'rgba(10, 91, 255, 0.22)',
    'rgba(0, 168, 107, 0.22)',
    'rgba(124, 58, 237, 0.22)'
];
const refundEntryTheme = {
    color: '#A94750',
    label: '#8D5B62',
    shadow: 'rgba(169, 71, 80, 0.20)'
};

function formatMoney(cents) {
            return (parseInt(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function press(key) {
            if (key === 'BS') {
                rawAmount = rawAmount.length > 1 ? rawAmount.slice(0, -1) : "0";
                if (rawAmount === "0" && pendingAction === null) {
                    amountInputHasStarted = false;
                }
            } else if (key === '00') {
                if (rawAmount !== "0" && rawAmount.length < 8) rawAmount += "00";
            } else {
                if (rawAmount === "0") rawAmount = key;
                else if (rawAmount.length < 10) rawAmount += key;
            }
            if (key !== 'BS' && rawAmount !== "0") {
                amountInputHasStarted = true;
            }
            displayEl.innerText = formatMoney(rawAmount);
            updateAmountContext();
            syncBottomNavigationVisibility('home');
        }

        function clearAmount(e) {
            if (e) e.stopPropagation();
            rawAmount = "0";
            amountInputHasStarted = false;
            displayEl.innerText = formatMoney(rawAmount);
            updateAmountContext();
            syncBottomNavigationVisibility('home');
        }

        function clearTransactionSessionState() {
            try {
                transactionStorageKeys.forEach((key) => localStorage.removeItem(key));
            } catch (error) {
                // The visible home state can still reset when storage is unavailable.
            }
        }

        function resetHomeAfterCompletedTransaction() {
            clearTransactionSessionState();
            pendingAction = null;
            entryThemeIndex = 0;
            rawAmount = "0";
            amountInputHasStarted = false;
            if (displayEl) displayEl.innerText = formatMoney(rawAmount);
            showAppView('home');
        }

        function updateAmountContext() {
            const showAmountEntry = pendingAction !== null || rawAmount !== "0";
            const transactionType = pendingAction
                ? getActionLabel(pendingAction).toUpperCase()
                : 'SALE';
            const safeThemeIndex = entryColors[entryThemeIndex] ? entryThemeIndex : 0;
            const isRefundEntry = transactionType.includes('REFUND');

            document.documentElement.style.setProperty(
                '--entry-color',
                isRefundEntry ? refundEntryTheme.color : entryColors[safeThemeIndex]
            );
            document.documentElement.style.setProperty(
                '--entry-label-color',
                isRefundEntry ? refundEntryTheme.label : '#667085'
            );
            document.documentElement.style.setProperty(
                '--entry-shadow',
                isRefundEntry ? refundEntryTheme.shadow : entryShadows[safeThemeIndex]
            );

            if (amountLabel) {
                amountLabel.textContent = 'TRANSACTION AMOUNT';
            }
            if (amountContext) {
                amountContext.classList.remove('error');
                amountContext.textContent = transactionType;
                const typeLength = transactionType.length;
                const typeSize = typeLength <= 8 ? 20 : typeLength <= 13 ? 18 : typeLength <= 18 ? 16 : 14;
                const typeTracking = typeLength <= 8 ? '0.10em' : typeLength <= 13 ? '0.06em' : '0.025em';
                amountContext.style.setProperty('--transaction-type-size', `${typeSize}px`);
                amountContext.style.setProperty('--transaction-type-tracking', typeTracking);
                amountContext.setAttribute('aria-label', `Transaction type: ${transactionType}`);
            }
            if (amountError) {
                amountError.textContent = '';
                amountError.classList.remove('show');
            }
            if (entryStage) {
                entryStage.classList.toggle('show-amount', showAmountEntry);
            }
            if (merchantBrandState) {
                merchantBrandState.setAttribute('aria-hidden', String(showAmountEntry));
            }
            if (amountEntryState) {
                amountEntryState.setAttribute('aria-hidden', String(!showAmountEntry));
            }
        }

        function resetTransactionAmount(actionName = null, themeIndex = actionName ? activeTab : 0) {
            pendingAction = actionName;
            entryThemeIndex = entryColors[themeIndex] ? themeIndex : 0;
            rawAmount = "0";
            amountInputHasStarted = false;
            displayEl.innerText = formatMoney(rawAmount);
            updateAmountContext();
            syncBottomNavigationVisibility('home');
        }

        
function openKeypad() {
            showAppView('home');
            updateAmountContext();
        }
        function closeKeypad(e) {
            if (e) e.stopPropagation();
            pendingAction = null;
            updateAmountContext();
        }

        function confirmAmount(e) {
            if (e) e.stopPropagation();
            if (rawAmount === "0") {
                if (amountError) {
                    amountError.textContent = 'Enter an amount to continue';
                    amountError.classList.add('show');
                }
                return;
            }

            const actionToRun = pendingAction;
            pendingAction = null;
            updateAmountContext();
            if (actionToRun) {
                startAction(actionToRun, rawAmount);
            } else {
                startAction('Sale', rawAmount);
            }
        }

        