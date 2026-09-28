# OPC (Open Payment Controller)

The payment terminal and user experience prototype ecosystem for Paywizard POS devices, supporting both attended and unattended retail, EV charging, and automated checkout flows.

## Language

**Payment Pane（支付区）**:
横屏 OPC 中展示支付应用、供用户选择支付方式的区域；区域名称不随左右位置变化。
_Avoid_: 左屏（作为固定业务名称）

**Advertising Pane（广告区）**:
横屏 OPC 中空闲时展示广告轮播图、交易期间改为展示商品明细的区域；区域名称不随左右位置变化。
_Avoid_: 右屏（作为固定业务名称）

**Customer Payment Display（顾客支付屏）**:
供顾客查看收银机下发交易的商品信息并选择支付方式的横屏 OPC 界面；收银员通过独立收银机操作。
_Avoid_: Unified POS（指代顾客支付屏时）

**Item Details（商品明细）**:
收银机下发交易时，供用户查看的本次交易商品信息。
_Avoid_: 交易记录（指代本次商品信息时）

**CASH（横屏顾客支付）**:
顾客选择后向收银员交付现金、由收银员确认收款的支付方式。
_Avoid_: 顾客确认收款

**WALLET（横屏顾客支付）**:
顾客支付屏中独立于 DEBIT SALE 与 CREDIT SALE 的钱包支付方式，目前服务商未定，原型仅模拟其支付过程。
_Avoid_: 银行卡支付、特定钱包品牌（未确定服务商时）

**Dual Pricing（双价）**:
同一交易按现金与银行卡支付展示不同应付价格；价格差异在顾客选择支付方式之前可见。
_Avoid_: 商品折扣（指代支付方式价差时）

**Tip（小费）**:
顾客在商品交易金额之外自愿选择的附加金额；与商品折扣、税额和双价差额分别展示。
_Avoid_: Card Price Adjustment

**Tip Adjust（小费调整）**:
对当前未结算批次中支持小费后调的已完成银行卡 Sale 修改小费；当前范围不包含 Capture。保存形成待执行的小费值，可在执行成功前增加、减少、清零或再次修改；执行成功后更新已生效小费，该笔不再出现在 Tip Adjust 中。
_Avoid_: 向所有交易统一加收小费、Auth-Incremental

**Tip Amount（小费金额）**:
一笔交易的小费总金额；在 Tip Adjust 中输入的数值替换该笔原小费，而不是追加差额。
_Avoid_: Final Tip Amount（界面名称）、追加小费金额

**Transaction Amount（小费调整中的交易金额）**:
一笔已完成交易中不含小费的固定金额；不随小费调整次数变化，交易总额等于该金额加上最终小费。
_Avoid_: 含小费总额、上一次调整后的总额

**Unadjusted Transactions（未调整小费的交易）**:
当前未结算批次中仍可在 Tip Adjust 中处理、尚未保存小费调整值的交易。零小费或原小费也允许保存并执行，仅已有小费不代表已调整。
_Avoid_: 零小费交易、所有未结算交易

**Adjusted Transactions（已调整小费的交易）**:
已保存小费调整值、等待执行的交易。离开 Tip Adjust 后保留其已保存值及 ADJUSTED 状态，同一笔再次保存会替换待执行值。
_Avoid_: 已执行成功、SAVED（独立界面状态）、有小费的交易

**Successfully Processed Tip Adjustment（已执行成功的小费调整）**:
已经执行成功并更新交易已生效金额的小费调整；对应交易从 Tip Adjust 工作列表中移除，交易记录仍保留。
_Avoid_: ADJUSTED（本界面指已保存待执行）、删除交易、已结算批次

**Tip Summary（小费调整汇总）**:
执行前供操作员核对已保存小费调整的汇总，包含待执行交易及其拟生效金额。
_Avoid_: 批次结算报告、已生效小费合计

**Cash Register Simulator（收银机模拟页）**:
代表收银员发起交易、确认现金收款和取消未完成交易的独立原型界面。
_Avoid_: 顾客支付屏、顾客操作面板

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
独立的终端批次结算操作，关闭当前批次并呈现结算结果；已保存的小费调整在批次结算前自动执行，未设置调整金额的交易会在关批前提示数量。
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
按操作独立配置的管理密码，适用于 Void、Refund、Close Batch 和 Tip Adjust；留空表示该操作不校验管理密码。
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
