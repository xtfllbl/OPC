# Design QA — Settlement-Focused Batch Reports

- Source visual truth: the user’s four supplied references for Card Transaction Summary, Card Brand Summary, Transaction Details, and the desired three-column Transactions list
- Implementation: `1.unified_pos.html`
- Viewport: 375 × 812 device frame
- States: current batch, previous batch, expanded Amex breakdown, and expanded transaction details
- Full-view comparison evidence: both batch variants were rendered in the existing terminal frame and inspected against the supplied references
- Focused comparison evidence: settlement grouping, card-brand logo slots, three-column detail header, card/cash marks, negative values, masked card details, and compact receipt references

## Findings

No actionable P0, P1, or P2 issues remain.

- Information architecture: batch reporting is settlement-focused. `AUTH`, `AUTH-INCREMENTAL`, and `VOID` are omitted from the summary, brand breakdown, and transaction details.
- Tip accounting: standalone `TIP` rows are omitted. Tip value is folded into `SALE` amounts without adding another transaction to sale or card-brand counts.
- Reconciliation: `CARD NET` is calculated from sale (including tip), refund, and capture activity and matches the top batch total.
- Transaction semantics: completion activity is displayed as `CAPTURE`; normal card and cash purchases are displayed as `Sale`, and refunds as `Refund`.
- Negative transactions: refund values use the existing muted refund red (`#A94750`) and always include a minus sign in summary, card-brand breakdown, cash summary, and transaction details.
- Card brands: real project assets render inside identical bordered logo tiles, with restrained optical sizing that preserves each mark’s aspect ratio.
- Transaction details: the expanded view uses `Date & Time / Total / Card details` columns. Each row exposes a compact date, emphasized time, receipt reference, amount, payment mark, transaction type, and masked card details.
- Data compatibility: terminal-provided `receiptNo`/`localReceiptNo` and card last-four fields are used when present, with deterministic demo fallbacks.
- Current/previous parity: both report variants render through the same grouping, ordering, amount-sign, brand, and detail-row rules.

## Primary Interactions Tested

- Opened Transactions → Reports → Current Batch Reports.
- Verified `SALE`, `REFUND`, `CAPTURE`, and the single settlement activity group.
- Confirmed current Card Net matches the top Card Net value.
- Confirmed TIP value is included in SALE while TIP does not add to transaction counts.
- Confirmed the Card Brand Summary keeps all count and amount columns aligned while logos occupy identical visible tiles.
- Expanded Transaction Details and verified the three-column header plus date, time, receipt reference, sale, cash sale, refund, and capture rows.
- Confirmed `TIP`, `AUTH`, and `VOID` are absent from current and previous report detail views.
- Opened Last Batch Reports and confirmed the same labels and expanded-detail structure.
- Parsed the inline script successfully and ran `git diff --check`.

## Comparison History

### Pass 1

- Finding: the included/excluded model exposed non-settlement actions and made the report harder to reconcile.
- Severity: P2.
- Fix: removed the excluded group, replaced the remaining label with `Settlement Activity`, and filtered authorization and void activity from report presentation.

### Pass 2

- Finding: raw card-brand assets had inconsistent perceived sizes.
- Severity: P2.
- Fix: introduced identical bordered logo tiles with controlled optical sizes for Visa, Mastercard, Amex, Discover, JCB, and UnionPay.

### Pass 3

- Finding: the original transaction detail rows required reading stacked title, ID, timestamp, and amount instead of supporting column scanning.
- Severity: P2.
- Fix: rebuilt expanded details as a compact `Date / Total / Card details` table based on the selected reference.

### Pass 4

- Finding: separate TIP rows overstated activity counts and duplicated information already represented by the sale.
- Severity: P1.
- Fix: merged tip value into sale amounts while preserving the underlying sale count, and removed TIP from brand and transaction-detail presentation.

### Pass 5

- Finding: the first transaction-detail column showed only time, making transactions from different calendar days ambiguous.
- Severity: P1.
- Fix: changed the column to `Date & Time` and introduced a compact three-level stack: date, emphasized time, and receipt reference.

final result: passed
