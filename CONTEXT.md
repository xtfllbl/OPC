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

**Reprint**:
The administrative capability to re-issue printed receipts for the last completed transaction or by specific receipt number.
_Avoid_: Print again, duplicate receipt, print copy

**Failure Receipt**:
The terminal outcome interface displayed when an authorization fails, declines, or encounters a processing error, offering a clear decline reason and retry affordance.
_Avoid_: Error page, decline screen, 6_receipt_failed.html

**Simulation Magic Numbers**:
Predictable test inputs that trigger deterministic terminal branches: any amount ending in `4` cents (e.g. $0.64, $1.04) simulates a declined transaction routed to Failure Receipt.
_Avoid_: Hardcoded bugs, mock triggers
