# OPC_ATTD 实机截图回填设计

日期：2026-09-25。状态：已按用户确认范围回填，并完成原型验收。

## 目标与证据

将实际终端中新增和调整的有人模式界面回填至 `OPC_ATTD/`，使其成为后续设计的当前基线。用户提供的 32 张截图及场景文件名是本次对齐依据；旧原型用于定位落点。截图只能确认可见界面和用户标注的场景，不能独立证明后台、支付通道或硬件行为。

截图目录：`/Users/beaver/Paywizard/OPC/screenshots/`。下表文件名均相对于该目录，保留用户原始拼写。

## 截图与回填范围

| 编号 | 截图文件名 | 可确认的界面/状态 | 原型落点 |
|---|---|---|---|
| 01 | 输入后的sale首页.png | Sale 金额输入后显示类型、金额及带金额 OK；底部导航隐藏 | index.html / js/keypad.js |
| 02 | 差额captrue警告弹窗.png | 超出持有金额时显示金额比较，提供 Cancel / Confirm Capture | 金额输入与确认弹窗 |
| 03 | 打印商户联.png | 成功结果页底部 Merchant Copy Printing 状态 | receipt.html |
| 04 | 当前批次（无现金交易）明细.png | 无现金汇总段；双重定价、审计风险、交易明细；标题实际为 Last Batch Reports | batch_reports.html |
| 05 | 当前批次（有现金交易）明细.png | 当前批次展开卡品牌；双重定价、现金汇总、审计风险 | batch_reports.html |
| 06 | 当前批次信息.png | OPEN 批次、MID/TID、卡/现金净额、卡交易与品牌汇总；无 Close Batch 按钮 | batch_reports.html |
| 07 | 交易列表.png | 日期时间/单号、交易类型/卡信息、金额/状态；包含现金及 OPEN AUTH | transactions.html |
| 08 | 交易列表筛选.png | All Types、Sales / Completed、Pre-Auths (Open)、Refunds、Voids、Cash Payments | transactions.html |
| 09 | 交易列表手输筛选.png | 搜索输入及数字软键盘；提示按 invoice、amount、receipt No. 搜索 | transactions.html |
| 10 | 结算及打印选项.png | Close Batch 成功、批次号与金额、Print Summary / Print Details / No Receipt 倒计时 | 结算结果页 |
| 11 | 默认首页.png | 商户名称/Logo、金额键盘、零金额 OK 灰态、底部三入口 | index.html |
| 12 | 选择打印顾客联.png | 成功交易信息、Email / Print / No Receipt 倒计时 | receipt.html |
| 13 | 已结算批次打印选项.png | Last Batch Reports 打印菜单：Batch Summary、Transaction Details、Summary + Details | batch_reports.html |
| 14 | 重排序的操作菜单.png | Sale/Void/Refund；PreAuth/Auth-Incremental/Capture；Close Batch/Reports；Reprint/Transaction | index.html |
| 15 | auth-incremental、capture、print卡号后4位、刷卡寻单多单选择.png | 卡尾号或刷卡匹配多笔时显示可滚动选择弹窗，底部 NO | 共用寻单流程 |
| 16 | auth-incremental、capture、print小票号码或卡号后4位寻单.png | Receipt No. 或 Card Last 4 Digits 输入及自定义数字键盘 | 共用寻单流程 |
| 17 | auth-incremental、capture寻单.png | 刷卡、手输小票号、交易列表三种寻单入口；示例标题 Auth-Incremental | 共用寻单流程 |
| 18 | authincremental,capture交易列表寻单.png | 用于追加授权/Capture 的待处理 PreAuth 列表，显示 OPEN AUTH，无类型筛选图标 | transactions.html |
| 19 | authincremental首页.png | 输入追加金额，同时显示 Current Hold / New Total Hold | index.html / js/keypad.js |
| 20 | authincremental寻单确认弹窗.png | 确认交易类型、当前持有金额、卡信息、Trace & Time 后继续追加授权 | 共用寻单确认 |
| 21 | capture首页.png | Capture 输入金额，显示 Original Hold / Max Allowed Capture | index.html / js/keypad.js |
| 22 | close batch进入当前批次信息.png | 从 Close Batch 进入当前批次时，右上角有 Close Batch 按钮 | batch_reports.html |
| 23 | closebatch时存在未capture或void的preauth提示弹窗.png | 未完成 PreAuth 数量/总额提示；Review Pre-Auths / Proceed Anyway | 批次结算流程 |
| 24 | closebathc确认弹窗.png | Close Current Batch?；Later / Close Now | 批次结算流程 |
| 25 | dual pricing选项.png | Card 在上、Cash 在下，分别显示价格；示例 $69.00 / $68.32 | cash_discount.html |
| 26 | preauth首页.png | PREAUTH 金额输入，初始金额为零 | index.html / js/keypad.js |
| 27 | print确认弹窗.png | Print Last Transaction?；交易类型、金额、卡、Trace & Time；Cancel / Print | Reprint 确认 |
| 28 | print寻单方式选择.png | 最近交易快捷打印及摘要；刷卡、手输、交易列表寻单 | index.html / js/pos_main.js |
| 29 | refund首页.png | REFUND 红色负金额及负金额 OK | index.html / js/keypad.js |
| 30 | void、refund、closebatch配置了密码校验（三者独立密码）.png | 三项操作独立配置密码；配置后出现 Manager PIN 弹窗及数字键盘 | 操作入口及设置 |
| 31 | void前确认弹窗.png | Void 确认交易类型/金额/卡/Trace & Time；NO / YES | Void 寻单确认 |
| 32 | void寻单.png | 手输小票号/卡尾号，Quick Void Last 快捷入口 | Void 寻单 |

## 回填前核实的原型差异

- `js/pos_main.js` 的 `startAction` 目前只有 Sale、Refund 的专用跳转；其他动作最终走 `alert` 占位。需要补充真实可点击的原型流程。
- `index.html` 预授权菜单目前称为 Auth，截图称为 PreAuth；原型仍有 Card、QR、Loyalty/Gift 通道切换。
- `js/keypad.js` 已有商户 Logo/金额状态切换、退款配色和输入后导航切换，属于可复用基础。
- 现有 Reprint 只有最近一笔和按小票号入口；需对照截图扩充寻单与交易确认。
- `cash_discount.html` 当前将传入金额视为现金价，并固定以 `cash × 1.04` 计算卡价；截图只有两种价格，不能仅凭 $69.00 / $68.32 反推出本次输入基准和费率规则。
- 金额 OK 当前只有文字，需补截图中的金额和零金额禁用态；退款金额当前缺少负号（`index.html:49,556`、`js/keypad.js:155-172`）。
- 交易列表当前筛选为 All Transactions/Card Payments/Cash Payments/Refunds；缺少截图状态徽标及按调用操作限定的寻单上下文（`transactions.html:430-449,683-742`）。
- 批次报表已有当前/最近/历史批次、品牌展开、交易明细和三种打印范围，可复用；缺少 Dual Pricing & Fee Savings、Audit & Risk 和结算确认链。Cash Summary 当前始终存在（`batch_reports.html:60-214`、`js/batch_reports.js:1102-1121`）。
- 顾客联已有 Email/Print/No Receipt，缺 Merchant Copy Printing 中间状态及倒计时（`receipt.html:1081-1143,1766-1779`）。
- 当前 Sale 路线为 Sale → Tip → Cash Discount → Card Receipt 或 Cash Change；截图未覆盖的步骤不能据此判断已删除。
- ADR-0001 已规定 OPC_ATTD 自包含、核心收银单页及独立报表页；本次回填没有已知理由改变这项架构决定。ADR-0002 的失败演示路线属于现有行为。

## 设计决策树

根目标已明确：将截图中的现状回填至原 OPC_ATTD，供下一步设计使用。

用户已确认：

1. 保留原设计视觉风格，同步截图中的功能、信息结构、菜单顺序和交互。
2. 保留截图外的 QR、Loyalty/Gift、小费、签名、现金找零、历史批次和既有失败流程。
3. Dual Pricing 不改变原逻辑：输入仍作为现金价，独立选择页仍以 `cash × 1.04` 计算卡价；仅将 CARD 调整到 CASH 上方。

菜单六个主要交易操作按截图排序；旧 Debit Sale、Debit Refund、Tip Adjust 放入 More operations，原通道开关仍保留。现有模块结构沿用 ADR-0001，本次为可逆原型调整，不新增架构 ADR。

## 资料冲突与待核对项

- 04 文件名说“当前批次”，画面标题为 Last Batch Reports；暂按“无现金批次明细结构”记录，不自行认定其所属批次。
- 02 一面标注 Max Allowed Capture，一面允许 Confirm Capture；回填可复现提示及按钮，不能由此推断支付通道一定接受超额 Capture。
- 03 打印商户联时仍显示 CUSTOMER COPY 分隔标题，记录为截图现状。
- 不同截图来自不同时间/交易/批次，示例金额及计数不应强行视为同一连续交易。
- 三个操作密码独立这一点来自用户文件名；密码值、长度和错误处理不在截图证据内。
- No Receipt 截图上的 5s / 8s 是采集时的剩余时间，不能当作初始倒计时时长。

## 已完成的回填

- 首页：零金额 OK 禁用、OK 显示金额、退款负号及配色、金额页返回；保留原商户品牌与金额键盘。
- 操作菜单：Sale / Void / Refund；PreAuth / Auth-Incremental / Capture；Close Batch / Reports；Reprint / Transaction。
- 寻单：小票号、卡尾四位、模拟呈卡、匹配多笔选择、交易列表选择、选单确认。Void 支持 Quick Void Last；Reprint 支持最近交易快捷打印。
- 追加授权/Capture：先选择原预授权，展示持有金额；追加金额与 New Total Hold 同步；超额 Capture 可取消保留金额或确认继续。
- PIN：Settings → Operation PINs 分别配置 Void、Refund、Close Batch，空值关闭对应校验；新增数字键盘、取消和错误反馈。
- 交易列表：日期/交易详情/金额三列、状态徽标、六种筛选、可操作数字搜索键盘；追加授权与 Capture 寻单只显示 OPEN AUTH。
- 批次：增加 Dual Pricing & Fee Savings、Audit & Risk；有现金显示 Cash Summary，无现金隐藏；保留品牌与明细展开、历史批次、三种打印范围。
- 结算：操作入口进入带 Close Batch 按钮的当前批次；普通确认 → 若有未完成预授权则提示数量/金额 → 检查预授权或继续 → 成功及汇总/明细打印选项。
- 小票：商户联打印中 → 顾客联 Email / Print / No Receipt；选择邮箱或进入签名时不会被倒计时打断。

## 原型演示边界与复现方法

- 主入口：`OPC_ATTD/index.html`。仓库根目录运行 `python3 -m http.server 8765 --bind 127.0.0.1`，打开 `http://127.0.0.1:8765/OPC_ATTD/index.html`。
- 新流程使用 `js/attended_demo.js` 中的浏览器演示交易；初始卡尾号 `0100` 对应 12 笔开放预授权。小票号 `001038` 初始持有 $35.00，输入 Capture $60.00 可复现超额提示。
- 模拟刷卡入口中点击 VISA ••••0100 代表呈卡事件；没有实际读卡或支付执行。PIN 是原型本地配置，不是生产权限机制。
- 演示交易存于当前标签页的 sessionStorage；完成追加授权、Capture 或 Void 后，列表及当前批次同步。结算保留上批次快照，原预授权仍可寻单。报表中的示例金额/笔数不硬抄不同时刻的截图。
- 双重定价统计字段使用演示记录中的显式示例数据，未推导新的计价公式。真实报表若接入，应提供相应字段；本次未定义新的后台合同。
- 商户联演示停留 1.6 秒；No Receipt 演示初始 10 秒。这是可调整的预览参数，不宣称由截图的 5s/8s 反推得出。
- 保留现有打印适配器及事件接入方式；浏览器回显不证明实机打印、邮件发送、密码权限或真实结算完成。
- 文件名/标题冲突的无现金截图用于共用批次结构；Current 与 Last 按实际入口展示各自标题。

## 验收结果

2026-09-25，本地浏览器验证：

| 路径/状态 | 结果 |
|---|---|
| 默认首页、金额 OK、退款负号、操作菜单、更多操作 | 通过 |
| 卡尾号 0100 → 12 笔选择 → 追加授权确认 → $35 + $1 = $36 | 通过 |
| Capture 交易列表选单 → $35 持有 / $60 Capture → 取消保留金额 / 确认成功 | 通过 |
| Void Quick Void Last 及交易确认、Reprint 最近交易确认及刷卡入口 | 通过 |
| 独立 PIN：Void 的测试 PIN 不通过 Refund，Refund 自己的 PIN 可通过 | 通过，临时测试配置已清空 |
| 六种筛选、票号 001038 搜索、数字搜索键盘 | 通过 |
| 当前批次有现金、Last Batch 无现金、三种批次打印选项 | 通过 |
| 结算确认、未完成预授权数量/金额、Review Pre-Auths 返回、继续结算 | 通过 |
| 无当前批次待处理预授权时直接进入成功页、Print Summary 反馈 | 通过 |
| 商户联打印中 → 顾客联选项及倒计时 → 自动返回 | 通过 |
| Sale → Tip → No Tip → 现金 $1.00 / 卡 $1.04 → 原末位 4 失败页 | 通过 |
| 375×812 菜单/弹窗/列表/报表无横向溢出 | 通过 |

代码检查：21 个独立或内嵌脚本语法通过，`git diff --check` 通过。4 项自动化检查验证追加金额不重复应用、Capture/已作废交易结算排除、结算快照、现金统计；运行：

```sh
node --test OPC_ATTD/tests/attended-prototype.test.cjs
```

验收截图：[菜单](validation/menu.png)、[Void 确认](validation/void-confirm.png)、[无现金批次](validation/last-batch-no-cash.png)、[交易搜索](validation/transactions-search.png)。
