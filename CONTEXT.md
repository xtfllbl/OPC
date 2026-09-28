# OPC (Open Payment Controller)

The payment terminal and user experience prototype ecosystem for Paywizard POS devices, supporting both attended and unattended retail, EV charging, and automated checkout flows.

## Language

**Attended POS**:
A terminal operating mode operated by a clerk or cashier at a checkout counter, featuring active channel switching and administrative tools.
_Avoid_: Clerk terminal, counter POS, manned POS

**Unattended POS**:
A self-service terminal operating mode where customers interact directly without cashier assistance, such as EV charging stations and Grab-and-Go kiosks.
_Avoid_: Self-service terminal, kiosk-only, automated checkout

**OPC_ATTD**:
The canonical module and workspace representing the Attended POS solution within the Open Payment Controller platform.
_Avoid_: Attendant app, Cashier system, POS_v2

**Unified POS**:
The primary workstation interface within OPC_ATTD that combines amount entry, multiple transaction channels (Card, QR, Loyalty/Gift), and terminal management into a single view.
_Avoid_: Home screen, main page, 1.unified_pos.html

**Batch Reports**:
Terminal settlement summaries and historical transaction records used for end-of-day closure and accounting audit.
_Avoid_: Daily report, settlement list, batch info

**Close Batch**:
The attended settlement action that closes the current batch and presents its settlement result.
_Avoid_: Batch Reports, Capture

**Settlement Copy**:
A receipt for a closed batch, available as a batch summary or transaction details.
_Avoid_: Transaction receipt, Customer Copy

**Reprint**:
The administrative capability to re-issue a receipt for a recorded transaction, selected as the latest transaction or located by receipt number, card lookup, card last four digits, or transaction list.
_Avoid_: Print again, duplicate receipt, print copy

**PreAuth**:
A pre-authorization transaction that establishes a hold amount for a later Capture or Void. The attended terminal labels an outstanding pre-authorization as OPEN AUTH.
_Avoid_: Auth when naming the attended transaction action

**Auth-Incremental**:
An action against an existing PreAuth to add to its current hold amount; its amount-entry view distinguishes the added amount from the new total hold amount.
_Avoid_: New PreAuth, Capture

**Capture**:
An action against an existing PreAuth to complete payment for a specified amount.
_Avoid_: Auth-Incremental, Close Batch

**Manager PIN**:
An operation-specific password check used when configured for Void, Refund, or Close Batch, with independent passwords for those three operations.
_Avoid_: Settings Exit password, shared operation password

**Failure Receipt**:
The terminal outcome interface displayed when an authorization fails, declines, or encounters a processing error, offering a clear decline reason and retry affordance.
_Avoid_: Error page, decline screen, 6_receipt_failed.html

**Simulation Magic Numbers**:
Predictable test inputs that trigger deterministic terminal branches: any amount ending in `4` cents (e.g. $0.64, $1.04) simulates a declined transaction routed to Failure Receipt.
_Avoid_: Hardcoded bugs, mock triggers

**Settings View**:
The administrative and configuration workspace within OPC_ATTD providing payment method toggles, system preferences, and feature flags above the primary navigation.
_Avoid_: Preferences page, config screen, options modal

**Settings Exit**:
The privileged terminal exit workflow requiring supervisor passkey verification (`99999999`) to transition from Attended POS out to the operating system launcher.
_Avoid_: Quit app, close window, logout button
