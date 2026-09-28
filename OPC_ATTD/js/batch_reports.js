// OPC_ATTD: Batch Reports Controller
const batchOverlay = document.getElementById('batch-overlay');
        const batchHome = document.getElementById('batch-home');
        const batchHistory = document.getElementById('batch-history');
        const batchHistoryList = document.getElementById('batch-history-list');
        const batchDetail = document.getElementById('batch-detail');
        const batchHeaderTitle = document.getElementById('batch-header-title');
        const batchLoadingState = document.getElementById('batch-loading-state');
        const batchErrorState = document.getElementById('batch-error-state');
        const batchErrorText = document.getElementById('batch-error-text');
        const batchDetailContent = document.getElementById('batch-detail-content');
        const batchTransactionList = document.getElementById('batch-transaction-list');
        const batchPaymentSummaryList = document.getElementById('batch-payment-summary-list');
        const batchCardTransactionSummary = document.getElementById('batch-card-transaction-summary');
        const batchTransactionsToggle = document.getElementById('batch-transactions-toggle');
        const batchHeaderActions = document.getElementById('batch-header-actions');
        const batchPrintButton = document.getElementById('batch-print-btn');
        const batchPrintMenu = document.getElementById('batch-print-menu');
        const batchPrintToast = document.getElementById('batch-print-toast');
        const batchFields = {
            transactionCount: document.getElementById('batch-transaction-count'),
            mid: document.getElementById('batch-mid'),
            tid: document.getElementById('batch-tid'),
            batchId: document.getElementById('batch-id'),
            settleStatus: document.getElementById('batch-settle-status'),
            cardNet: document.getElementById('batch-card-net'),
            cashNet: document.getElementById('batch-cash-net'),
            totalReceipts: document.getElementById('batch-total-receipts'),
            cashSaleCount: document.getElementById('batch-cash-sale-count'),
            cashSaleAmount: document.getElementById('batch-cash-sale-amount'),
            cashRefundCount: document.getElementById('batch-cash-refund-count'),
            cashRefundAmount: document.getElementById('batch-cash-refund-amount'),
            cashNetCount: document.getElementById('batch-cash-net-count'),
            cashSummaryNet: document.getElementById('batch-cash-summary-net')
        };
        const batchCurrencyMap = {
            '036': { code: 'AUD', symbol: '$', digits: 2 },
            '124': { code: 'CAD', symbol: '$', digits: 2 },
            '156': { code: 'CNY', symbol: '', digits: 2 },
            '344': { code: 'HKD', symbol: '$', digits: 2 },
            '392': { code: 'JPY', symbol: '', digits: 0 },
            '702': { code: 'SGD', symbol: '$', digits: 2 },
            '826': { code: 'GBP', symbol: '', digits: 2 },
            '840': { code: 'USD', symbol: '$', digits: 2 },
            '978': { code: 'EUR', symbol: '', digits: 2 }
        };
        const demoBatchInfo = {
            current: {
                sn: 'WP20031Q21000000',
                packageName: 'com.wizarpos.usbdevicedemo',
                summary: {
                    mid: '10800000003',
                    tid: 'T1344444',
                    batchId: '000042',
                    currencyCode: '840',
                    debitTotalCount: 10,
                    debitTotalAmount: 32415,
                    creditTotalCount: 3,
                    creditTotalAmount: 2570,
                    settleStatus: 'OPEN'
                },
                settlementList: [
                    { amount: 4895, transId: '251209142807', batchId: '000042', tranTime: '2026-06-25 11:24:39', transType: 'SALE', cardType: 'VISA' },
                    { amount: 3200, transId: '251209143122', batchId: '000042', tranTime: '2026-06-25 11:31:22', transType: 'SALE', cardType: 'MASTERCARD' },
                    { amount: 1250, transId: '251209144018', batchId: '000042', tranTime: '2026-06-25 11:40:18', transType: 'REFUND', cardType: 'VISA' },
                    { amount: 4800, transId: '251209150208', batchId: '000042', tranTime: '2026-06-25 12:02:08', transType: 'SALE', cardType: 'AMEX' },
                    { amount: 2750, transId: '251209151426', batchId: '000042', tranTime: '2026-06-25 12:14:26', transType: 'SALE', cardType: 'DISCOVER' },
                    { amount: 2500, transId: 'C000042', batchId: '000042', tranTime: '2026-06-25 12:18:44', transType: 'CASH SALE', cardType: 'CASH' },
                    { amount: 1875, transId: '251209153117', batchId: '000042', tranTime: '2026-06-25 12:31:17', transType: 'SALE', cardType: 'VISA' },
                    { amount: 6420, transId: '251209154509', batchId: '000042', tranTime: '2026-06-25 12:45:09', transType: 'SALE', cardType: 'MASTERCARD' },
                    { amount: 820, transId: '251209160238', batchId: '000042', tranTime: '2026-06-25 13:02:38', transType: 'REFUND', cardType: 'MASTERCARD' },
                    { amount: 2280, transId: '251209161854', batchId: '000042', tranTime: '2026-06-25 13:18:54', transType: 'DEBIT SALE', cardType: 'VISA' },
                    { amount: 1875, transId: 'C000043', batchId: '000042', tranTime: '2026-06-25 13:27:31', transType: 'CASH SALE', cardType: 'CASH' },
                    { amount: 1540, transId: '251209163946', batchId: '000042', tranTime: '2026-06-25 13:39:46', transType: 'SALE', cardType: 'DISCOVER' },
                    { amount: 3660, transId: '251209165503', batchId: '000042', tranTime: '2026-06-25 13:55:03', transType: 'SALE', cardType: 'AMEX' },
                    { amount: 500, transId: '251209171122', batchId: '000042', tranTime: '2026-06-25 14:11:22', transType: 'REFUND', cardType: 'AMEX' },
                    { amount: 995, transId: '251209172803', batchId: '000042', tranTime: '2026-06-25 14:28:03', transType: 'SALE', cardType: 'VISA' },
                    { amount: 550, transId: 'C000044', batchId: '000042', tranTime: '2026-06-25 14:36:48', transType: 'CASH REFUND', cardType: 'CASH' },
                    { amount: 1500, transId: '251209174512', batchId: '000042', tranTime: '2026-06-25 14:45:12', transType: 'CAPTURE', cardType: 'VISA' },
                    { amount: 900, transId: '251209175126', batchId: '000042', tranTime: '2026-06-25 14:51:26', transType: 'TIP ADJUST', cardType: 'MASTERCARD' },
                    { amount: 2000, transId: '251209175944', batchId: '000042', tranTime: '2026-06-25 14:59:44', transType: 'VOID', cardType: 'DISCOVER' },
                    { amount: 3000, transId: '251209180317', batchId: '000042', tranTime: '2026-06-25 15:03:17', transType: 'AUTH', cardType: 'AMEX' },
                    { amount: 3360, transId: '251209180742', receiptNo: 'R000042021', batchId: '000042', tranTime: '2026-06-25 15:07:42', transType: 'SALE', cardType: 'JCB', cardLastFour: '3521' },
                    { amount: 4125, transId: '251209181208', receiptNo: 'R000042022', batchId: '000042', tranTime: '2026-06-25 15:12:08', transType: 'SALE', cardType: 'UNIONPAY', cardLastFour: '6218' },
                    { amount: 2840, transId: '251209181633', receiptNo: 'R000042023', batchId: '000042', tranTime: '2026-06-25 15:16:33', transType: 'SALE', cardType: 'DINERS CLUB', cardLastFour: '3057' },
                    { amount: 3765, transId: '251209182104', receiptNo: 'R000042024', batchId: '000042', tranTime: '2026-06-25 15:21:04', transType: 'SALE', cardType: 'MAESTRO', cardLastFour: '6759' },
                    { amount: 5290, transId: '251209182527', receiptNo: 'R000042025', batchId: '000042', tranTime: '2026-06-25 15:25:27', transType: 'SALE', cardType: 'RUPAY', cardLastFour: '8174' },
                    { amount: 2485, transId: '251209182951', receiptNo: 'R000042026', batchId: '000042', tranTime: '2026-06-25 15:29:51', transType: 'SALE', cardType: 'INTERAC', cardLastFour: '4506' },
                    { amount: 4610, transId: '251209183418', receiptNo: 'R000042027', batchId: '000042', tranTime: '2026-06-25 15:34:18', transType: 'SALE', cardType: 'ELO', cardLastFour: '5092' },
                    { amount: 3195, transId: '251209183842', receiptNo: 'R000042028', batchId: '000042', tranTime: '2026-06-25 15:38:42', transType: 'SALE', cardType: 'EFTPOS', cardLastFour: '7338' },
                    { amount: 5875, transId: '251209184307', receiptNo: 'R000042029', batchId: '000042', tranTime: '2026-06-25 15:43:07', transType: 'SALE', cardType: 'MIR', cardLastFour: '2204' }
                ]
            },
            last: {
                sn: 'WP20031Q21000000',
                packageName: 'com.wizarpos.usbdevicedemo',
                summary: {
                    mid: '10800000003',
                    tid: 'T1344444',
                    batchId: '000041',
                    currencyCode: '840',
                    debitTotalCount: 12,
                    debitTotalAmount: 66459,
                    creditTotalCount: 4,
                    creditTotalAmount: 5150,
                    settleStatus: 'CLOSED'
                },
                settlementList: [
                    { amount: 10000, transId: '251208174516', batchId: '000041', tranTime: '2026-06-24 17:45:16', transType: 'SALE', cardType: 'VISA' },
                    { amount: 11565, transId: '251208181204', batchId: '000041', tranTime: '2026-06-24 18:12:04', transType: 'SALE', cardType: 'MASTERCARD' },
                    { amount: 2300, transId: '251208191533', batchId: '000041', tranTime: '2026-06-24 19:15:33', transType: 'REFUND', cardType: 'VISA' },
                    { amount: 7230, transId: '251208192148', batchId: '000041', tranTime: '2026-06-24 19:21:48', transType: 'SALE', cardType: 'AMEX' },
                    { amount: 4500, transId: 'C000038', batchId: '000041', tranTime: '2026-06-24 19:32:10', transType: 'CASH SALE', cardType: 'CASH' },
                    { amount: 4480, transId: '251208194407', batchId: '000041', tranTime: '2026-06-24 19:44:07', transType: 'SALE', cardType: 'DISCOVER' },
                    { amount: 3625, transId: '251208200218', batchId: '000041', tranTime: '2026-06-24 20:02:18', transType: 'SALE', cardType: 'VISA' },
                    { amount: 1250, transId: '251208201654', batchId: '000041', tranTime: '2026-06-24 20:16:54', transType: 'REFUND', cardType: 'MASTERCARD' },
                    { amount: 5840, transId: '251208203139', batchId: '000041', tranTime: '2026-06-24 20:31:39', transType: 'SALE', cardType: 'MASTERCARD' },
                    { amount: 3200, transId: 'C000039', batchId: '000041', tranTime: '2026-06-24 20:43:12', transType: 'CASH SALE', cardType: 'CASH' },
                    { amount: 1999, transId: '251208205728', batchId: '000041', tranTime: '2026-06-24 20:57:28', transType: 'SALE', cardType: 'VISA' },
                    { amount: 675, transId: '251208211443', batchId: '000041', tranTime: '2026-06-24 21:14:43', transType: 'REFUND', cardType: 'AMEX' },
                    { amount: 8500, transId: '251208213026', batchId: '000041', tranTime: '2026-06-24 21:30:26', transType: 'SALE', cardType: 'AMEX' },
                    { amount: 2735, transId: '251208214918', batchId: '000041', tranTime: '2026-06-24 21:49:18', transType: 'SALE', cardType: 'DISCOVER' },
                    { amount: 1000, transId: 'C000040', batchId: '000041', tranTime: '2026-06-24 22:03:54', transType: 'CASH REFUND', cardType: 'CASH' },
                    { amount: 1375, transId: '251208221945', batchId: '000041', tranTime: '2026-06-24 22:19:45', transType: 'SALE', cardType: 'MASTERCARD' },
                    { amount: 925, transId: '251208223608', batchId: '000041', tranTime: '2026-06-24 22:36:08', transType: 'REFUND', cardType: 'DISCOVER' },
                    { amount: 6660, transId: '251208225201', batchId: '000041', tranTime: '2026-06-24 22:52:01', transType: 'SALE', cardType: 'JCB' },
                    { amount: 1850, transId: 'C000041', batchId: '000041', tranTime: '2026-06-24 23:08:37', transType: 'CASH SALE', cardType: 'CASH' },
                    { amount: 2450, transId: '251208232416', batchId: '000041', tranTime: '2026-06-24 23:24:16', transType: 'SALE', cardType: 'VISA' },
                    { amount: 1850, transId: '251208233245', batchId: '000041', tranTime: '2026-06-24 23:32:45', transType: 'CAPTURE', cardType: 'MASTERCARD' },
                    { amount: 650, transId: '251208234019', batchId: '000041', tranTime: '2026-06-24 23:40:19', transType: 'TIP ADJUST', cardType: 'VISA' },
                    { amount: 1250, transId: '251208234833', batchId: '000041', tranTime: '2026-06-24 23:48:33', transType: 'VOID', cardType: 'AMEX' },
                    { amount: 4200, transId: '251208235507', batchId: '000041', tranTime: '2026-06-24 23:55:07', transType: 'AUTH', cardType: 'DISCOVER' },
                    { amount: 4380, transId: '251209000318', receiptNo: 'R000041025', batchId: '000041', tranTime: '2026-06-25 00:03:18', transType: 'SALE', cardType: 'UNIONPAY', cardLastFour: '6286' },
                    { amount: 2955, transId: '251209001147', receiptNo: 'R000041026', batchId: '000041', tranTime: '2026-06-25 00:11:47', transType: 'SALE', cardType: 'DINERS CLUB', cardLastFour: '3019' },
                    { amount: 3890, transId: '251209002019', receiptNo: 'R000041027', batchId: '000041', tranTime: '2026-06-25 00:20:19', transType: 'SALE', cardType: 'MAESTRO', cardLastFour: '6764' },
                    { amount: 5475, transId: '251209002846', receiptNo: 'R000041028', batchId: '000041', tranTime: '2026-06-25 00:28:46', transType: 'SALE', cardType: 'RUPAY', cardLastFour: '8127' },
                    { amount: 2610, transId: '251209003714', receiptNo: 'R000041029', batchId: '000041', tranTime: '2026-06-25 00:37:14', transType: 'SALE', cardType: 'INTERAC', cardLastFour: '4518' },
                    { amount: 4795, transId: '251209004542', receiptNo: 'R000041030', batchId: '000041', tranTime: '2026-06-25 00:45:42', transType: 'SALE', cardType: 'ELO', cardLastFour: '5063' },
                    { amount: 3275, transId: '251209005409', receiptNo: 'R000041031', batchId: '000041', tranTime: '2026-06-25 00:54:09', transType: 'SALE', cardType: 'EFTPOS', cardLastFour: '7391' },
                    { amount: 6040, transId: '251209010238', receiptNo: 'R000041032', batchId: '000041', tranTime: '2026-06-25 01:02:38', transType: 'SALE', cardType: 'MIR', cardLastFour: '2208' }
                ]
            }
        };

        function createDemoHistoricalBatchInfo(index) {
            const source = JSON.parse(JSON.stringify(demoBatchInfo.last));
            const safeIndex = Math.max(0, Math.min(14, Number(index) || 0));
            const batchNumber = 41 - safeIndex;
            const batchId = String(batchNumber).padStart(6, '0');
            const baseDate = new Date(Date.UTC(2026, 5, 24));
            baseDate.setUTCDate(baseDate.getUTCDate() - safeIndex);
            const dateText = baseDate.toISOString().slice(0, 10);
            const multipliers = [1, 0.82, 1.14, 0.93, 1.27, 0.76, 1.08, 0.89, 1.19, 0.97, 1.31, 0.84, 1.04, 0.91, 1.22];
            const multiplier = multipliers[safeIndex];

            source.summary.batchId = batchId;
            source.summary.settleStatus = 'CLOSED';
            source.settlementList = source.settlementList.map((transaction, transactionIndex) => {
                if (safeIndex === 0) return transaction;
                const timeText = String(transaction.tranTime || '').split(' ')[1] || '12:00:00';
                const amountVariation = 0.92 + (((transactionIndex + safeIndex) % 5) * 0.04);
                const isCash = normalizeBatchPaymentType(transaction) === 'CASH';
                return {
                    ...transaction,
                    amount: Math.max(1, Math.round(Math.abs(transaction.amount) * multiplier * amountVariation)),
                    batchId,
                    tranTime: `${dateText} ${timeText}`,
                    transId: isCash
                        ? `C${batchId}${String(transactionIndex + 1).padStart(2, '0')}`
                        : `${String(batchNumber).padStart(2, '0')}${String(transactionIndex + 1).padStart(10, '0')}`,
                    receiptNo: `R${batchId}${String(transactionIndex + 1).padStart(3, '0')}`
                };
            });

            return source;
        }

        function getDemoBatchHistoryReports() {
            return Array.from({ length: 15 }, (_, index) => {
                const batchInfo = createDemoHistoricalBatchInfo(index);
                const lastTransaction = batchInfo.settlementList[batchInfo.settlementList.length - 1];
                return {
                    batchInfo,
                    closedAt: lastTransaction && lastTransaction.tranTime
                        ? lastTransaction.tranTime
                        : ''
                };
            });
        }

        function getDemoHistoricalBatchInfo(batchId) {
            const normalizedBatchId = formatBatchId(batchId);
            const match = getDemoBatchHistoryReports().find((entry) => (
                formatBatchId(entry.batchInfo.summary.batchId) === normalizedBatchId
            ));
            return match ? match.batchInfo : createDemoHistoricalBatchInfo(0);
        }
        let activeBatchKind = null;
        let activeHistoricalBatchId = '';
        let batchRequestToken = 0;
        let batchTransactionsExpanded = false;
        let batchPrintToastTimer = 0;

        
function setElementText(element, value) {
            if (!element) return;
            element.textContent = value === null || value === undefined || value === '' ? '-' : String(value);
        }

        function setBatchPrintAvailable(available) {
            if (!batchPrintButton) return;
            const closeMode = new URLSearchParams(location.search).get('mode') === 'close';
            if (batchHeaderActions) batchHeaderActions.hidden = closeMode;
            available = available && !closeMode;
            batchPrintButton.classList.toggle('hidden', !available);
            if (!available) closeBatchPrintMenu();
        }

        function closeBatchPrintMenu() {
            if (batchPrintMenu) batchPrintMenu.classList.remove('open');
            if (batchPrintButton) batchPrintButton.setAttribute('aria-expanded', 'false');
        }

        function toggleBatchPrintMenu(event) {
            if (event) event.stopPropagation();
            if (!batchPrintMenu || !batchPrintButton || batchPrintButton.classList.contains('hidden')) return;
            const shouldOpen = !batchPrintMenu.classList.contains('open');
            closeBatchPrintMenu();
            if (shouldOpen) {
                batchPrintMenu.classList.add('open');
                batchPrintButton.setAttribute('aria-expanded', 'true');
            }
        }

        function showBatchPrintToast(message) {
            if (!batchPrintToast) return;
            window.clearTimeout(batchPrintToastTimer);
            batchPrintToast.textContent = message;
            batchPrintToast.classList.add('show');
            batchPrintToastTimer = window.setTimeout(() => {
                batchPrintToast.classList.remove('show');
            }, 2200);
        }

        async function handleBatchReportPrint(printScope, event) {
            if (event) event.stopPropagation();
            if (!activeBatchKind) return;

            const scopeLabels = {
                summary: 'Batch Summary',
                details: 'Transaction Details',
                all: 'Summary + Details'
            };
            const normalizedScope = Object.prototype.hasOwnProperty.call(scopeLabels, printScope)
                ? printScope
                : 'summary';
            const payload = {
                batchType: activeBatchKind,
                printScope: normalizedScope,
                batchId: activeHistoricalBatchId || undefined
            };
            const globalMethodNames = ['printBatchReportNative', 'printBatchReports'];
            const bridgeMethodNames = ['printBatchReport', 'printBatchReports'];
            const bridgeNames = [
                'PaywizardTerminal',
                'PayWizardTerminal',
                'paywizardTerminal',
                'TerminalBridge',
                'NativeBridge',
                'Android',
                'android'
            ];

            closeBatchPrintMenu();
            showBatchPrintToast(`Printing ${scopeLabels[normalizedScope]}...`);

            try {
                let handled = false;
                for (const methodName of globalMethodNames) {
                    if (typeof window[methodName] === 'function') {
                        await window[methodName](JSON.stringify(payload));
                        handled = true;
                        break;
                    }
                }

                if (!handled) {
                    for (const bridgeName of bridgeNames) {
                        const bridge = window[bridgeName];
                        if (!bridge) continue;
                        for (const methodName of bridgeMethodNames) {
                            if (typeof bridge[methodName] === 'function') {
                                await bridge[methodName](JSON.stringify(payload));
                                handled = true;
                                break;
                            }
                        }
                        if (handled) break;
                    }
                }

                window.dispatchEvent(new CustomEvent('opc:print-batch-report', { detail: payload }));
                showBatchPrintToast(`${scopeLabels[normalizedScope]} sent to printer.`);
            } catch (error) {
                showBatchPrintToast(error && error.message ? error.message : 'Unable to print batch report.');
            }
        }

        function showBatchHistoryView() {
            activeBatchKind = null;
            activeHistoricalBatchId = '';
            batchRequestToken += 1;
            setBatchTransactionsExpanded(false);
            setBatchPrintAvailable(false);
            if (batchHeaderTitle) batchHeaderTitle.textContent = 'Batch History';
            if (batchHome) batchHome.classList.add('hidden');
            if (batchHistory) batchHistory.classList.remove('hidden');
            if (batchDetail) batchDetail.classList.add('hidden');
        }

        function showBatchHome() {
            activeBatchKind = null;
            activeHistoricalBatchId = '';
            batchRequestToken += 1;
            setBatchTransactionsExpanded(false);
            setBatchPrintAvailable(false);
            if (batchHeaderTitle) batchHeaderTitle.textContent = 'Batch Reports';
            if (batchHome) batchHome.classList.remove('hidden');
            if (batchHistory) batchHistory.classList.add('hidden');
            if (batchDetail) batchDetail.classList.add('hidden');
        }

        function openBatchInfoPage() {
            closePrintMenu(null, true);
            closeKeypad(null);
            closeSettings(null, true);
            showBatchHome();
            if (batchOverlay) batchOverlay.classList.add('open');
        }

        function closeBatchInfoPage(e) {
            if (e) e.stopPropagation();
            batchRequestToken += 1;
            window.location.href = 'index.html';
        }

        function handleBatchBack(event) {
            if (event) event.stopPropagation();
            if (activeBatchKind === 'history') {
                showBatchHistoryView();
                return;
            }
            if (new URLSearchParams(location.search).get('mode') === 'close') { location.href='index.html?view=transactions'; return; }
            if (activeBatchKind) {
                showBatchHome();
                return;
            }
            if (batchHistory && !batchHistory.classList.contains('hidden')) {
                showBatchHome();
                return;
            }
            closeBatchInfoPage(null);
        }

        function setBatchDetailState(state, message = '') {
            if (batchLoadingState) batchLoadingState.classList.toggle('hidden', state !== 'loading');
            if (batchErrorState) batchErrorState.classList.toggle('hidden', state !== 'error');
            if (batchDetailContent) batchDetailContent.classList.toggle('hidden', state !== 'ready');
            setBatchPrintAvailable(state === 'ready' && Boolean(activeBatchKind));
            if (batchErrorText && message) batchErrorText.textContent = message;
        }

        function retryBatchInfo(event) {
            if (event) event.stopPropagation();
            if (!activeBatchKind) return;
            openBatchDetail(activeBatchKind, activeHistoricalBatchId);
        }

        function setBatchTransactionsExpanded(expanded) {
            batchTransactionsExpanded = Boolean(expanded);
            if (batchTransactionsToggle) {
                batchTransactionsToggle.setAttribute('aria-expanded', String(batchTransactionsExpanded));
            }
            if (batchTransactionList) {
                batchTransactionList.hidden = !batchTransactionsExpanded;
            }
        }

        function toggleBatchTransactions(event) {
            if (event) event.stopPropagation();
            setBatchTransactionsExpanded(!batchTransactionsExpanded);
        }

        function calculateBatchHistoryTotals(batchInfo, suppliedTotals = {}) {
            const transactions = Array.isArray(batchInfo && batchInfo.settlementList)
                ? batchInfo.settlementList
                : [];
            const currencyCode = batchInfo && batchInfo.summary ? batchInfo.summary.currencyCode : '840';
            const cashSummary = summarizeBatchCash(transactions);
            const cardNet = transactions.reduce((total, transaction) => {
                if (normalizeBatchPaymentType(transaction) === 'CASH') return total;
                return total + getBatchSettlementAmount(transaction);
            }, 0);
            const resolvedCardNet = Number.isFinite(Number(suppliedTotals.cardNet))
                ? Number(suppliedTotals.cardNet)
                : cardNet;
            const resolvedCashNet = Number.isFinite(Number(suppliedTotals.cashNet))
                ? Number(suppliedTotals.cashNet)
                : cashSummary.netAmount;
            const resolvedTotal = Number.isFinite(Number(suppliedTotals.totalReceipts))
                ? Number(suppliedTotals.totalReceipts)
                : resolvedCardNet + resolvedCashNet;

            return {
                currencyCode,
                cardNet: resolvedCardNet,
                cashNet: resolvedCashNet,
                totalReceipts: resolvedTotal
            };
        }

        function normalizeBatchHistoryPayload(payload) {
            let data = payload;
            if (typeof data === 'string') {
                const trimmed = data.trim();
                if (!trimmed) return [];
                data = JSON.parse(trimmed);
            }

            const rows = Array.isArray(data)
                ? data
                : (data && (data.items || data.batchList || data.history || data.reports));
            if (!Array.isArray(rows)) return [];

            return rows.slice(0, 15).map((row) => {
                const source = row && (row.batchInfo || row.report || row.data || row);
                const batchInfo = source && source.summary
                    ? normalizeBatchInfoPayload(source)
                    : normalizeBatchInfoPayload({
                        summary: {
                            mid: row && (row.mid || row.merchantId),
                            tid: row && (row.tid || row.terminalId),
                            batchId: row && (row.batchId || row.id),
                            currencyCode: row && row.currencyCode,
                            settleStatus: 'CLOSED'
                        },
                        settlementList: row && Array.isArray(row.settlementList) ? row.settlementList : []
                    });
                return {
                    batchInfo,
                    closedAt: row && (row.closedAt || row.settledAt || row.closeTime || row.settleTime) || '',
                    totals: calculateBatchHistoryTotals(batchInfo, row || {})
                };
            });
        }

        function formatBatchHistoryDate(value) {
            if (!value) return 'Closed batch';
            const parsed = new Date(String(value).replace(' ', 'T'));
            if (Number.isNaN(parsed.getTime())) return String(value);
            return parsed.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }

        function renderBatchHistory(reports) {
            if (!batchHistoryList) return;
            batchHistoryList.innerHTML = '';

            if (!reports.length) {
                const empty = document.createElement('div');
                empty.className = 'batch-history-state';
                empty.textContent = 'No closed batch reports are available.';
                batchHistoryList.appendChild(empty);
                return;
            }

            reports.slice(0, 15).forEach((report) => {
                const summary = report.batchInfo.summary;
                const totals = report.totals || calculateBatchHistoryTotals(report.batchInfo);
                const batchId = formatBatchId(summary.batchId);
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'batch-history-card';
                card.setAttribute('aria-label', `Open batch ${batchId} reports`);

                const top = document.createElement('div');
                top.className = 'batch-history-card-top';
                const title = document.createElement('span');
                title.className = 'batch-history-batch-id';
                title.textContent = `BATCH ${batchId}`;
                const date = document.createElement('span');
                date.className = 'batch-history-date';
                date.textContent = formatBatchHistoryDate(report.closedAt);
                const arrow = document.createElement('span');
                arrow.className = 'material-symbols-rounded batch-history-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                arrow.textContent = 'chevron_right';
                top.append(title, date, arrow);

                const identity = document.createElement('div');
                identity.className = 'batch-history-identity';
                identity.textContent = `MID ${summary.mid || '-'}  •  TID ${summary.tid || '-'}`;

                const totalsGrid = document.createElement('div');
                totalsGrid.className = 'batch-history-totals';
                [
                    ['Card Net', totals.cardNet, ''],
                    ['Cash Net', totals.cashNet, ''],
                    ['Total Receipts', totals.totalReceipts, 'receipts']
                ].forEach(([labelText, value, className]) => {
                    const item = document.createElement('span');
                    item.className = `batch-history-total${className ? ` ${className}` : ''}`;
                    const label = document.createElement('span');
                    label.className = 'batch-history-total-label';
                    label.textContent = labelText;
                    const amount = document.createElement('span');
                    amount.className = 'batch-history-total-value';
                    amount.textContent = formatBatchAmount(value, totals.currencyCode);
                    item.append(label, amount);
                    totalsGrid.appendChild(item);
                });

                card.append(top, identity, totalsGrid);
                card.addEventListener('click', () => openBatchDetail('history', batchId));
                batchHistoryList.appendChild(card);
            });
        }

        async function fetchBatchHistoryFromTerminal() {
            const methodNames = ['getBatchHistory', 'getRecentBatchHistory', 'getClosedBatchList', 'getBatchReportList'];
            const bridgeNames = [
                'PaywizardTerminal',
                'PayWizardTerminal',
                'paywizardTerminal',
                'TerminalBridge',
                'NativeBridge',
                'Android',
                'android'
            ];

            for (const methodName of methodNames) {
                if (typeof window[methodName] === 'function') {
                    return normalizeBatchHistoryPayload(await window[methodName](15));
                }
            }
            for (const bridgeName of bridgeNames) {
                const bridge = window[bridgeName];
                if (!bridge) continue;
                for (const methodName of methodNames) {
                    if (typeof bridge[methodName] === 'function') {
                        return normalizeBatchHistoryPayload(await bridge[methodName](15));
                    }
                }
            }

            await new Promise(resolve => setTimeout(resolve, 120));
            return getDemoBatchHistoryReports().map((report) => ({
                ...report,
                totals: calculateBatchHistoryTotals(report.batchInfo)
            }));
        }

        async function openBatchHistory() {
            showBatchHistoryView();
            const requestToken = batchRequestToken;
            if (batchHistoryList) {
                batchHistoryList.innerHTML = '<div class="batch-history-state"><div class="batch-spinner" aria-hidden="true"></div><div>Loading batch history...</div></div>';
            }
            try {
                const reports = await fetchBatchHistoryFromTerminal();
                if (requestToken !== batchRequestToken) return;
                renderBatchHistory(reports);
            } catch (error) {
                if (requestToken !== batchRequestToken || !batchHistoryList) return;
                batchHistoryList.innerHTML = '';
                const state = document.createElement('div');
                state.className = 'batch-history-state';
                const message = document.createElement('div');
                message.textContent = error && error.message ? error.message : 'Unable to load batch history.';
                const retry = document.createElement('button');
                retry.type = 'button';
                retry.className = 'batch-retry-btn';
                retry.textContent = 'Retry';
                retry.addEventListener('click', openBatchHistory);
                state.append(message, retry);
                batchHistoryList.appendChild(state);
            }
        }

        async function openBatchDetail(kind, batchId = '') {
            activeBatchKind = kind === 'history'
                ? 'history'
                : (kind === 'last' ? 'last' : 'current');
            activeHistoricalBatchId = activeBatchKind === 'history' ? formatBatchId(batchId) : '';
            const requestToken = ++batchRequestToken;
            setBatchTransactionsExpanded(false);

            if (batchHeaderTitle) {
                batchHeaderTitle.textContent = activeBatchKind === 'history'
                    ? `Batch ${activeHistoricalBatchId} Reports`
                    : (activeBatchKind === 'last' ? 'Last Batch Reports' : 'Current Batch Reports');
            }
            if (batchHome) batchHome.classList.add('hidden');
            if (batchHistory) batchHistory.classList.add('hidden');
            if (batchDetail) batchDetail.classList.remove('hidden');
            setBatchDetailState('loading');

            try {
                const batchInfo = await fetchBatchInfoFromTerminal(activeBatchKind, activeHistoricalBatchId);
                if (requestToken !== batchRequestToken) return;
                renderBatchInfo(batchInfo, activeBatchKind === 'history' ? 'last' : activeBatchKind);
                setBatchDetailState('ready');
            } catch (error) {
                if (requestToken !== batchRequestToken) return;
                const message = error && error.message ? error.message : 'Unable to load batch reports.';
                setBatchDetailState('error', message);
            }
        }

        async function fetchBatchInfoFromTerminal(kind, batchId = '') {
            const directMethods = kind === 'history'
                ? ['getHistoricalBatchInfo', 'getBatchReportById', 'getClosedBatchInfo']
                : (kind === 'last'
                    ? ['getLastBatchInfo', 'getLastSettlementBatchInfo', 'getLastBatchSettlement', 'getLastBatch']
                    : ['getCurrentBatchInfo', 'getCurrentBatchSettlement', 'getCurrentBatch']);
            const genericMethods = ['getBatchInfo', 'queryBatchInfo', 'getSettlementInfo'];
            const bridgeNames = [
                'PaywizardTerminal',
                'PayWizardTerminal',
                'paywizardTerminal',
                'TerminalBridge',
                'NativeBridge',
                'Android',
                'android'
            ];
            const errors = [];

            for (const methodName of directMethods) {
                if (typeof window[methodName] === 'function') {
                    try {
                        return normalizeBatchInfoPayload(await window[methodName](kind === 'history' ? batchId : kind));
                    } catch (error) {
                        errors.push(error);
                    }
                }
            }

            for (const bridgeName of bridgeNames) {
                const bridge = window[bridgeName];
                if (!bridge) continue;

                for (const methodName of directMethods) {
                    if (typeof bridge[methodName] === 'function') {
                        try {
                            return normalizeBatchInfoPayload(await bridge[methodName](kind === 'history' ? batchId : undefined));
                        } catch (error) {
                            errors.push(error);
                        }
                    }
                }

                for (const methodName of genericMethods) {
                    if (typeof bridge[methodName] === 'function') {
                        try {
                            return normalizeBatchInfoPayload(await bridge[methodName](kind === 'history'
                                ? JSON.stringify({ kind, batchId })
                                : kind));
                        } catch (error) {
                            errors.push(error);
                        }
                    }
                }
            }

            const webkitHandler = window.webkit
                && window.webkit.messageHandlers
                && window.webkit.messageHandlers.paywizardBatchInfo;
            if (webkitHandler && typeof webkitHandler.postMessage === 'function') {
                try {
                    return normalizeBatchInfoPayload(await requestBatchInfoFromWebkit(kind, webkitHandler, batchId));
                } catch (error) {
                    errors.push(error);
                }
            }

            if (errors.length) {
                throw errors[errors.length - 1];
            }

            await new Promise(resolve => setTimeout(resolve, 350));
            const fallback = kind === 'history'
                ? getDemoHistoricalBatchInfo(batchId)
                : AttendedDemo.toBatch(kind);
            return normalizeBatchInfoPayload(JSON.parse(JSON.stringify(fallback)));
        }

        function requestBatchInfoFromWebkit(kind, handler, batchId = '') {
            return new Promise((resolve, reject) => {
                const callbackName = `__paywizardBatchInfo_${Date.now()}_${Math.random().toString(16).slice(2)}`;
                const timer = setTimeout(() => {
                    delete window[callbackName];
                    reject(new Error('Batch info request timed out.'));
                }, 8000);

                window[callbackName] = (payload) => {
                    clearTimeout(timer);
                    delete window[callbackName];
                    resolve(payload);
                };

                handler.postMessage({
                    type: 'getBatchInfo',
                    batchKind: kind,
                    batchId,
                    callback: callbackName
                });
            });
        }

        function parseBatchPayload(payload) {
            if (typeof payload === 'string') {
                const trimmed = payload.trim();
                if (!trimmed) throw new Error('Empty batch response.');
                return JSON.parse(trimmed);
            }
            return payload;
        }

        function unwrapBatchPayload(payload) {
            let data = parseBatchPayload(payload);
            const wrapperKeys = ['data', 'result', 'payload', 'batchInfo', 'settlementInfo'];

            for (let i = 0; i < 4; i += 1) {
                if (!data || typeof data !== 'object' || data.summary) break;
                const wrapperKey = wrapperKeys.find(key => data[key] !== undefined);
                if (!wrapperKey) break;
                data = parseBatchPayload(data[wrapperKey]);
            }

            return data;
        }

        function toBatchNumber(value) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        function normalizeBatchInfoPayload(payload) {
            const data = unwrapBatchPayload(payload);
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid batch response.');
            }

            const summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
            const settlementList = Array.isArray(data.settlementList) ? data.settlementList : [];

            return {
                sn: data.sn || '',
                packageName: data.packageName || '',
                summary: {
                    mid: summary.mid || '',
                    tid: summary.tid || '',
                    batchId: summary.batchId || '',
                    currencyCode: summary.currencyCode || '',
                    debitTotalCount: toBatchNumber(summary.debitTotalCount),
                    debitTotalAmount: toBatchNumber(summary.debitTotalAmount),
                    creditTotalCount: toBatchNumber(summary.creditTotalCount),
                    creditTotalAmount: toBatchNumber(summary.creditTotalAmount),
                    settleStatus: summary.settleStatus || ''
                },
                settlementList: settlementList.map((item) => ({
                    status: item.status || "",
                    cashEquivalentCents: toBatchNumber(item.cashEquivalentCents),
                    feeCents: toBatchNumber(item.feeCents),
                    tipCents: toBatchNumber(item.tipCents),
                    amount: toBatchNumber(item && item.amount),
                    transId: item && item.transId ? String(item.transId) : '',
                    receiptNo: item && (item.receiptNo || item.localReceiptNo)
                        ? String(item.receiptNo || item.localReceiptNo)
                        : '',
                    batchId: item && item.batchId ? String(item.batchId) : '',
                    tranTime: item && item.tranTime ? String(item.tranTime) : '',
                    transType: item && item.transType ? String(item.transType) : '',
                    cardType: item && item.cardType ? String(item.cardType) : '',
                    cardLastFour: item && (item.cardLastFour || item.lastFour || item.last4)
                        ? String(item.cardLastFour || item.lastFour || item.last4).replace(/\D/g, '').slice(-4)
                        : ''
                }))
            };
        }

        function getBatchCurrencyInfo(currencyCode) {
            const code = currencyCode ? String(currencyCode).padStart(3, '0') : '';
            return batchCurrencyMap[code] || { code: code || '-', symbol: '', digits: 2 };
        }

        function formatBatchAmount(amount, currencyCode) {
            const currencyInfo = getBatchCurrencyInfo(currencyCode);
            const numericAmount = toBatchNumber(amount);
            const divisor = Math.pow(10, currencyInfo.digits);
            const majorAmount = numericAmount / divisor;
            const absoluteAmount = Math.abs(majorAmount);
            const formatted = absoluteAmount.toLocaleString('en-US', {
                minimumFractionDigits: currencyInfo.digits,
                maximumFractionDigits: currencyInfo.digits
            });
            const sign = majorAmount < 0 ? '-' : '';
            if (currencyInfo.symbol) {
                return `${sign}${currencyInfo.symbol}${formatted}`;
            }
            return `${sign}${formatted} ${currencyInfo.code}`.trim();
        }

        function formatBatchCount(count, singular, plural) {
            const safeCount = toBatchNumber(count);
            return `${safeCount} ${safeCount === 1 ? singular : plural}`;
        }

        function formatBatchId(batchId) {
            if (batchId === null || batchId === undefined || batchId === '') return '';
            return String(batchId).padStart(6, '0');
        }

        function formatBatchCountValue(count) {
            return `Count ${toBatchNumber(count)}`;
        }

        function formatBatchSummaryAmount(amount, currencyCode) {
            return formatBatchAmount(amount, currencyCode);
        }

        function normalizeBatchPaymentType(transaction) {
            const rawCardType = transaction && transaction.cardType
                ? String(transaction.cardType).trim().toUpperCase()
                : '';
            const rawTransType = transaction && transaction.transType
                ? String(transaction.transType).trim().toUpperCase()
                : '';
            const compactType = rawCardType.replace(/[^A-Z0-9]/g, '');

            if (rawCardType.includes('CASH') || rawTransType.includes('CASH')) return 'CASH';
            if (compactType === 'MC' || compactType === 'MASTER' || compactType === 'MASTERCARD') return 'MASTERCARD';
            if (compactType === 'AMEX' || compactType === 'AMERICANEXPRESS') return 'AMEX';
            if (compactType === 'VISA') return 'VISA';
            if (compactType === 'DISCOVER') return 'DISCOVER';
            if (compactType === 'JCB') return 'JCB';
            if (compactType === 'UNIONPAY' || compactType === 'CUP') return 'UNIONPAY';
            if (compactType === 'DINERS' || compactType === 'DINERSCLUB' || compactType === 'DCI') return 'DINERS';
            if (compactType === 'MAESTRO' || compactType === 'MAESTROCARD') return 'MAESTRO';
            if (compactType === 'RUPAY' || compactType === 'RUPAYCARD') return 'RUPAY';
            if (compactType === 'INTERAC' || compactType === 'INTERACDEBIT') return 'INTERAC';
            if (compactType === 'ELO' || compactType === 'ELOCARD') return 'ELO';
            if (compactType === 'EFTPOS' || compactType === 'EFTPOSAUSTRALIA') return 'EFTPOS';
            if (compactType === 'MIR' || compactType === 'MIRCARD' || compactType === 'MIRPAY' || compactType === 'NSPK') return 'MIR';
            return rawCardType || 'OTHER';
        }

        function getBatchTransactionKind(transaction) {
            const rawType = transaction && transaction.transType
                ? String(transaction.transType).trim().toUpperCase()
                : '';
            const isRefund = rawType.includes('REFUND');
            const isVoid = rawType.includes('VOID');
            const isTip = rawType.includes('TIP');
            const isCompletion = rawType.includes('CAPTURE')
                || rawType.includes('COMPLETION')
                || rawType.includes('COMPLETE');
            const isIncremental = rawType.includes('INCREMENT');
            const isAuthOnly = rawType.includes('AUTH') && !isCompletion && !isIncremental;
            const isDebit = rawType.includes('DEBIT');

            if (isVoid) return { key: 'VOID', settlement: 'excluded' };
            if (rawType === 'AUTH COMPLETED') return { key: 'AUTH', settlement: 'excluded' };
            if (isRefund) return { key: 'REFUND', settlement: 'negative' };
            if (isTip) return { key: 'TIP', settlement: 'positive' };
            if (isCompletion) return { key: 'CAPTURE', settlement: 'positive' };
            if (isIncremental) return { key: 'AUTH-INCREMENTAL', settlement: 'excluded' };
            if (isAuthOnly) return { key: 'AUTH', settlement: 'excluded' };
            return { key: 'SALE', settlement: 'positive' };
        }

        function getBatchSettlementAmount(transaction) {
            const amount = Math.abs(toBatchNumber(transaction && transaction.amount));
            const kind = getBatchTransactionKind(transaction);
            if (kind.settlement === 'negative') return -amount;
            if (kind.settlement === 'excluded') return 0;
            return amount;
        }

        function getVisibleBatchTransactions(transactions) {
            return transactions.filter((transaction) => {
                const kind = getBatchTransactionKind(transaction);
                return kind.key === 'SALE'
                    || kind.key === 'REFUND'
                    || kind.key === 'CAPTURE';
            });
        }

        function summarizeBatchCardBrands(transactions) {
            const totals = new Map();

            transactions.forEach((transaction) => {
                const paymentType = normalizeBatchPaymentType(transaction);
                if (paymentType === 'CASH') return;

                const kind = getBatchTransactionKind(transaction);
                if (kind.settlement === 'excluded') return;

                const isTip = kind.key === 'TIP';
                const visibleKind = isTip
                    ? { key: 'SALE', settlement: 'positive' }
                    : kind;
                const current = totals.get(paymentType) || {
                    type: paymentType,
                    count: 0,
                    amount: 0,
                    details: new Map()
                };
                const detail = current.details.get(visibleKind.key) || {
                    type: visibleKind.key,
                    count: 0,
                    amount: 0,
                    settlement: visibleKind.settlement
                };

                if (!isTip) current.count += 1;
                current.amount += getBatchSettlementAmount(transaction);
                if (!isTip) detail.count += 1;
                detail.amount += getBatchSettlementAmount(transaction);
                current.details.set(visibleKind.key, detail);
                totals.set(paymentType, current);
            });

            const preferredOrder = [
                'VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'JCB', 'UNIONPAY',
                'DINERS', 'MAESTRO', 'RUPAY', 'INTERAC', 'ELO', 'EFTPOS', 'MIR', 'OTHER'
            ];
            const detailOrder = ['SALE', 'REFUND', 'CAPTURE'];
            return Array.from(totals.values())
                .map((total) => ({
                    ...total,
                    details: Array.from(total.details.values()).sort((left, right) => {
                        const leftIndex = detailOrder.indexOf(left.type);
                        const rightIndex = detailOrder.indexOf(right.type);
                        return leftIndex - rightIndex || left.type.localeCompare(right.type);
                    })
                }))
                .sort((left, right) => {
                    const leftIndex = preferredOrder.indexOf(left.type);
                    const rightIndex = preferredOrder.indexOf(right.type);
                    const normalizedLeft = leftIndex === -1 ? preferredOrder.length : leftIndex;
                    const normalizedRight = rightIndex === -1 ? preferredOrder.length : rightIndex;
                    return normalizedLeft - normalizedRight || left.type.localeCompare(right.type);
                });
        }

        function summarizeBatchCardTransactions(transactions) {
            const included = new Map(['SALE', 'REFUND', 'CAPTURE'].map(type => [type, { type, count: 0, amount: 0, settlement: type === 'REFUND' ? 'negative' : 'positive' }]));
            let cardNet = 0;

            transactions.forEach((transaction) => {
                if (normalizeBatchPaymentType(transaction) === 'CASH') return;

                const kind = getBatchTransactionKind(transaction);
                if (kind.settlement === 'excluded') return;

                const isTip = kind.key === 'TIP';
                const visibleKind = isTip
                    ? { key: 'SALE', settlement: 'positive' }
                    : kind;
                const current = included.get(visibleKind.key) || {
                    type: visibleKind.key,
                    count: 0,
                    amount: 0,
                    settlement: visibleKind.settlement
                };
                const absoluteAmount = Math.abs(toBatchNumber(transaction && transaction.amount));
                const signedAmount = visibleKind.settlement === 'negative' ? -absoluteAmount : absoluteAmount;

                if (!isTip) current.count += 1;
                current.amount += signedAmount;
                included.set(visibleKind.key, current);
                cardNet += signedAmount;
            });

            const preferredOrder = ['SALE', 'REFUND', 'CAPTURE'];
            const sortRows = (rows) => Array.from(rows.values()).sort((left, right) => {
                const leftIndex = preferredOrder.indexOf(left.type);
                const rightIndex = preferredOrder.indexOf(right.type);
                const normalizedLeft = leftIndex === -1 ? preferredOrder.length : leftIndex;
                const normalizedRight = rightIndex === -1 ? preferredOrder.length : rightIndex;
                return normalizedLeft - normalizedRight || left.type.localeCompare(right.type);
            });

            return {
                included: sortRows(included),
                cardNet
            };
        }

        function renderBatchCardTransactionSummary(transactions, currencyCode) {
            if (!batchCardTransactionSummary) return;
            batchCardTransactionSummary.innerHTML = '';
            const summary = summarizeBatchCardTransactions(transactions);

            const appendGroupLabel = (label, className = '') => {
                const heading = document.createElement('div');
                heading.className = `batch-summary-group-label${className ? ` ${className}` : ''}`;
                heading.textContent = label;
                batchCardTransactionSummary.appendChild(heading);
            };

            const appendRows = (rows) => {
                if (!rows.length) {
                    const empty = document.createElement('div');
                    empty.className = 'batch-summary-empty';
                    empty.textContent = 'No transactions';
                    batchCardTransactionSummary.appendChild(empty);
                    return;
                }

                rows.forEach((item) => {
                    const row = document.createElement('div');
                    row.className = 'batch-summary-type-row';

                    const label = document.createElement('div');
                    label.className = 'batch-summary-type-label';
                    label.textContent = item.type;

                    const count = document.createElement('div');
                    count.className = 'batch-summary-type-count';
                    count.textContent = String(item.count);

                    const amount = document.createElement('div');
                    amount.className = 'batch-summary-type-amount';
                    const isNegative = item.settlement === 'negative' || item.type === 'VOID';
                    const displayedAmount = isNegative
                        ? -Math.abs(item.amount)
                        : Math.abs(item.amount);
                    amount.textContent = formatBatchAmount(displayedAmount, currencyCode);
                    amount.classList.toggle('negative', isNegative);

                    row.append(label, count, amount);
                    batchCardTransactionSummary.appendChild(row);
                });
            };

            appendGroupLabel('Settlement Activity');
            appendRows(summary.included);

            const netRow = document.createElement('div');
            netRow.className = 'batch-summary-net-row';
            const netLabel = document.createElement('div');
            netLabel.className = 'batch-summary-net-label';
            netLabel.textContent = 'Card Net';
            const netAmount = document.createElement('div');
            netAmount.className = 'batch-summary-net-amount';
            netAmount.textContent = formatBatchAmount(summary.cardNet, currencyCode);
            netRow.append(netLabel, netAmount);
            batchCardTransactionSummary.appendChild(netRow);

        }

        function getBatchCardBrandAsset(type) {
            const assets = {
                VISA: { summarySrc: 'assets/visa.svg', detailSrc: 'assets/visa.svg', className: 'brand-visa', shortName: 'VISA' },
                MASTERCARD: { summarySrc: 'assets/mastercard.svg', detailSrc: 'assets/mastercard.svg', className: 'brand-mastercard', shortName: 'MC' },
                AMEX: { summarySrc: 'assets/amex.svg', detailSrc: 'assets/amex.svg', className: 'brand-amex', shortName: 'AMEX' },
                DISCOVER: { summarySrc: 'assets/discover.svg', detailSrc: 'assets/discover.svg', className: 'brand-discover', shortName: 'DISC' },
                JCB: { summarySrc: 'assets/jcb.svg', detailSrc: 'assets/jcb.svg', className: 'brand-jcb', shortName: 'JCB' },
                UNIONPAY: { summarySrc: 'assets/unionpay.svg', detailSrc: 'assets/unionpay.svg', className: 'brand-unionpay', shortName: 'CUP' },
                DINERS: { summarySrc: 'assets/diners.svg', detailSrc: 'assets/diners.svg', className: 'brand-diners', shortName: 'DINERS' },
                MAESTRO: { summarySrc: 'assets/maestro-mark.svg', detailSrc: 'assets/maestro-mark.svg', className: 'brand-maestro', shortName: 'MAESTRO' },
                RUPAY: { summarySrc: 'assets/rupay.svg', detailSrc: 'assets/rupay.svg', className: 'brand-rupay', shortName: 'RUPAY' },
                INTERAC: { summarySrc: 'assets/Interac.png', detailSrc: 'assets/Interac.png', className: 'brand-interac', shortName: 'INTERAC' },
                ELO: { summarySrc: 'assets/elo.svg', detailSrc: 'assets/elo.svg', className: 'brand-elo', shortName: 'ELO' },
                EFTPOS: { summarySrc: 'assets/eftpos.svg', detailSrc: 'assets/eftpos.svg', className: 'brand-eftpos', shortName: 'EFTPOS' },
                MIR: { summarySrc: 'assets/mir.svg', detailSrc: 'assets/mir.svg', className: 'brand-mir', shortName: 'MIR' }
            };
            return assets[type] || null;
        }

        function summarizeBatchCash(transactions) {
            const cashTransactions = transactions.filter((transaction) => normalizeBatchPaymentType(transaction) === 'CASH' && getBatchTransactionKind(transaction).settlement !== 'excluded');
            const saleTransactions = cashTransactions.filter((transaction) => !getBatchTransactionKind(transaction).key.includes('REFUND'));
            const refundTransactions = cashTransactions.filter((transaction) => getBatchTransactionKind(transaction).key.includes('REFUND'));
            const saleAmount = saleTransactions.reduce(
                (total, transaction) => total + Math.abs(toBatchNumber(transaction && transaction.amount)),
                0
            );
            const refundAmount = refundTransactions.reduce(
                (total, transaction) => total + Math.abs(toBatchNumber(transaction && transaction.amount)),
                0
            );

            return {
                saleCount: saleTransactions.length,
                saleAmount,
                refundCount: refundTransactions.length,
                refundAmount,
                count: cashTransactions.length,
                netAmount: saleAmount - refundAmount
            };
        }

        function renderBatchReconciliation(transactions, currencyCode) {
            const cashSummary = summarizeBatchCash(transactions);
            const cardNet = transactions.reduce((total, transaction) => {
                if (normalizeBatchPaymentType(transaction) === 'CASH') return total;
                return total + getBatchSettlementAmount(transaction);
            }, 0);
            const totalReceipts = cardNet + cashSummary.netAmount;

            setElementText(batchFields.cardNet, formatBatchAmount(cardNet, currencyCode));
            setElementText(batchFields.cashNet, formatBatchAmount(cashSummary.netAmount, currencyCode));
            setElementText(batchFields.totalReceipts, formatBatchAmount(totalReceipts, currencyCode));
            setElementText(batchFields.cashSaleCount, String(cashSummary.saleCount));
            setElementText(batchFields.cashSaleAmount, formatBatchAmount(cashSummary.saleAmount, currencyCode));
            setElementText(batchFields.cashRefundCount, String(cashSummary.refundCount));
            setElementText(batchFields.cashRefundAmount, formatBatchAmount(-cashSummary.refundAmount, currencyCode));
            if (batchFields.cashRefundAmount) {
                batchFields.cashRefundAmount.classList.toggle('negative', cashSummary.refundAmount > 0);
            }
            setElementText(batchFields.cashNetCount, String(cashSummary.count));
            setElementText(batchFields.cashSummaryNet, formatBatchAmount(cashSummary.netAmount, currencyCode));
        }

        function renderBatchPaymentSummary(transactions, currencyCode) {
            if (!batchPaymentSummaryList) return;
            batchPaymentSummaryList.innerHTML = '';

            const paymentTotals = summarizeBatchCardBrands(transactions);
            if (!paymentTotals.length) {
                const empty = document.createElement('div');
                empty.className = 'batch-payment-empty';
                empty.textContent = 'No card transactions.';
                batchPaymentSummaryList.appendChild(empty);
                return;
            }

            paymentTotals.forEach((total) => {
                const group = document.createElement('div');
                group.className = 'batch-payment-group';

                const row = document.createElement('button');
                row.className = 'batch-payment-row';
                row.type = 'button';

                const brand = document.createElement('div');
                brand.className = 'batch-payment-brand';
                const brandAsset = getBatchCardBrandAsset(total.type);
                if (brandAsset) {
                    const frame = document.createElement('span');
                    frame.className = 'batch-payment-brand-frame';
                    const logo = document.createElement('img');
                    logo.className = `batch-payment-brand-logo ${brandAsset.className}`;
                    logo.src = brandAsset.summarySrc;
                    logo.alt = total.type;
                    frame.appendChild(logo);
                    brand.appendChild(frame);
                } else {
                    brand.textContent = total.type;
                }

                const count = document.createElement('div');
                count.className = 'batch-payment-count';
                count.textContent = String(total.count);

                const amount = document.createElement('div');
                amount.className = 'batch-payment-amount';
                amount.textContent = formatBatchAmount(total.amount, currencyCode);

                const chevron = document.createElement('span');
                chevron.className = 'material-symbols-rounded batch-payment-chevron';
                chevron.setAttribute('aria-hidden', 'true');
                chevron.textContent = 'chevron_right';

                const breakdown = document.createElement('div');
                breakdown.className = 'batch-payment-breakdown';
                breakdown.hidden = true;

                total.details.forEach((detail) => {
                    const detailRow = document.createElement('div');
                    detailRow.className = 'batch-payment-detail-row';

                    const title = document.createElement('div');
                    title.className = 'batch-payment-detail-title';
                    title.textContent = detail.type;

                    const detailCount = document.createElement('div');
                    detailCount.className = 'batch-payment-detail-count';
                    detailCount.textContent = String(detail.count);

                    const detailAmount = document.createElement('div');
                    detailAmount.className = 'batch-payment-detail-amount';
                    const detailIsNegative = detail.settlement === 'negative' || detail.type === 'VOID';
                    const detailDisplayAmount = detailIsNegative
                        ? -Math.abs(detail.amount)
                        : Math.abs(detail.amount);
                    detailAmount.textContent = formatBatchAmount(detailDisplayAmount, currencyCode);
                    detailAmount.classList.toggle('negative', detailIsNegative);

                    detailRow.append(title, detailCount, detailAmount);
                    breakdown.appendChild(detailRow);
                });

                const startsExpanded = total.type === 'AMEX';
                row.setAttribute('aria-expanded', String(startsExpanded));
                breakdown.hidden = !startsExpanded;
                row.addEventListener('click', () => {
                    const expanded = row.getAttribute('aria-expanded') === 'true';
                    row.setAttribute('aria-expanded', String(!expanded));
                    breakdown.hidden = expanded;
                });

                row.append(brand, count, amount, chevron);
                group.append(row, breakdown);
                batchPaymentSummaryList.appendChild(group);
            });
        }

        function renderBatchInfo(payload, kind) {
            const data = normalizeBatchInfoPayload(payload);
            const summary = data.summary;
            const transactionCount = getVisibleBatchTransactions(data.settlementList).length;
            const settleStatus = summary.settleStatus || (kind === 'last' ? 'CLOSED' : 'OPEN');
            const isClosed = settleStatus.toUpperCase() === 'CLOSED';

            setElementText(batchFields.transactionCount, formatBatchCount(transactionCount, 'item', 'items'));
            setElementText(batchFields.mid, summary.mid);
            setElementText(batchFields.tid, summary.tid);
            setElementText(batchFields.batchId, formatBatchId(summary.batchId));
            setElementText(batchFields.settleStatus, settleStatus);
            if (batchFields.settleStatus) batchFields.settleStatus.classList.toggle('closed', isClosed);

            renderBatchCardTransactionSummary(data.settlementList, summary.currencyCode);
            renderBatchPaymentSummary(data.settlementList, summary.currencyCode);
            renderBatchReconciliation(data.settlementList, summary.currencyCode);
            renderBatchTransactions(data.settlementList, summary.currencyCode);
            setBatchTransactionsExpanded(false);
            window.AttendedBatch?.render(data, kind);
        }

        function renderBatchTransactions(transactions, currencyCode) {
            if (!batchTransactionList) return;
            batchTransactionList.innerHTML = '';
            const visibleTransactions = getVisibleBatchTransactions(transactions);

            if (!visibleTransactions.length) {
                const empty = document.createElement('div');
                empty.className = 'batch-empty';
                empty.textContent = 'No settlement transactions.';
                batchTransactionList.appendChild(empty);
                return;
            }

            const header = document.createElement('div');
            header.className = 'batch-tx-table-header';
            ['Date & Time', 'Total', 'Card details'].forEach((labelText) => {
                const label = document.createElement('span');
                label.textContent = labelText;
                header.appendChild(label);
            });
            batchTransactionList.appendChild(header);

            visibleTransactions.forEach((transaction) => {
                const row = document.createElement('div');
                row.className = 'batch-tx-row';

                const date = document.createElement('div');
                date.className = 'batch-tx-date';

                const calendarDate = document.createElement('div');
                calendarDate.className = 'batch-tx-calendar-date';

                const time = document.createElement('div');
                time.className = 'batch-tx-time';
                const parsedTime = transaction.tranTime ? new Date(transaction.tranTime.replace(' ', 'T')) : null;
                calendarDate.textContent = parsedTime && !Number.isNaN(parsedTime.getTime())
                    ? parsedTime.toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: '2-digit'
                    })
                    : '-';
                time.textContent = parsedTime && !Number.isNaN(parsedTime.getTime())
                    ? parsedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : (transaction.tranTime || '-');

                const receipt = document.createElement('div');
                receipt.className = 'batch-tx-receipt';
                const rawReceipt = String(transaction.transId || '');
                const localReceipt = String(transaction.receiptNo || '');
                receipt.textContent = localReceipt || (rawReceipt.startsWith('C')
                    ? rawReceipt
                    : `#${rawReceipt.slice(-6)}`);
                date.append(calendarDate, time, receipt);

                const kind = getBatchTransactionKind(transaction);
                const paymentType = normalizeBatchPaymentType(transaction);
                const isCash = paymentType === 'CASH';
                const isNegative = kind.settlement === 'negative' || kind.key === 'VOID';

                const amount = document.createElement('div');
                amount.className = 'batch-tx-amount';
                amount.textContent = formatBatchAmount(
                    isNegative ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
                    currencyCode
                );
                amount.classList.toggle('negative', isNegative);

                const payment = document.createElement('div');
                payment.className = 'batch-tx-payment';

                const mark = document.createElement('span');
                mark.className = `batch-tx-payment-mark${isCash ? ' batch-tx-cash-mark' : ''}`;
                const brandAsset = getBatchCardBrandAsset(paymentType);
                if (isCash) {
                    mark.textContent = 'CASH';
                } else if (brandAsset) {
                    const logo = document.createElement('img');
                    logo.className = `batch-tx-payment-logo ${brandAsset.className}`;
                    logo.src = brandAsset.detailSrc;
                    logo.alt = paymentType;
                    mark.appendChild(logo);
                } else {
                    mark.textContent = paymentType.slice(0, 3);
                }

                const paymentCopy = document.createElement('div');
                paymentCopy.className = 'batch-tx-payment-copy';

                const paymentTitle = document.createElement('div');
                paymentTitle.className = 'batch-tx-payment-title';
                if (kind.key === 'REFUND') paymentTitle.textContent = 'Refund';
                else if (kind.key === 'SALE') paymentTitle.textContent = 'Sale';
                else if (kind.key === 'CAPTURE') paymentTitle.textContent = 'Capture';
                else paymentTitle.textContent = kind.key.replaceAll('-', ' ');

                const paymentMeta = document.createElement('div');
                paymentMeta.className = 'batch-tx-payment-meta';
                if (isCash) {
                    paymentMeta.textContent = 'Cash';
                } else {
                    const shortName = brandAsset ? brandAsset.shortName : paymentType;
                    const lastFour = transaction.cardLastFour
                        || rawReceipt.replace(/\D/g, '').slice(-4).padStart(4, '0');
                    paymentMeta.textContent = `${shortName} ••••${lastFour}`;
                }

                paymentCopy.append(paymentTitle, paymentMeta);
                payment.append(mark, paymentCopy);
                row.append(date, amount, payment);
                batchTransactionList.appendChild(row);
            });
        }

        document.addEventListener('click', (event) => {
            if (!batchPrintMenu || !batchPrintMenu.classList.contains('open')) return;
            if (batchHeaderActions && batchHeaderActions.contains(event.target)) return;
            closeBatchPrintMenu();
        });

        if (batchDetail) {
            batchDetail.addEventListener('scroll', closeBatchPrintMenu, { passive: true });
        }

document.addEventListener('DOMContentLoaded', () => {
    showBatchHome();
});
