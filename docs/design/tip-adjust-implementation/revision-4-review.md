# Tip Adjust 第四轮实现与验收

2026-09-28。状态：已完成 OPC_ATTD 本地实现与验收，未部署。采用两阶段流程、A 单行导航、保存后 ADJUSTED、执行后移出，以及 Close Batch 先自动调整再关批。用户明确本轮原型不考虑执行失败，统一模拟成功。

## 已明确的本轮需求

- 对比 Dejavoo POS 的录入、Tip Summary、执行过程，考虑为已保存的小费调整增加统一执行入口。
- 将列表状态筛选从右上角移至当前 All 所在行，展开选项；为右上角主操作腾出位置。
- 编辑器原交易信息补充交易日期与时间。
- 调整状态移入原交易信息区，离开顶栏。
- 提供多种顶栏/导航布局，保留交易切换和返回列表。

## 参考事实与现状

来源：[iPOSpays 官方 POS Tip Adjustment](https://knowledge.ipospays.com/ipospays/how-to-adjust-tips-on-ipospays#tip-adjustment-on-the-payment-terminal-pos)，本日查阅。

官方步骤为输入小费 → OK → Tip Summary → 右上角绿色箭头 → 确认 → 结果；截图中汇总显示调整笔数、调整小费合计及批次小费合计。文档没有说明本项目所需的草稿持久化、搜索筛选对执行范围的影响、部分失败或超时处理，不能据此推断。

第二轮决策选择 SAVE 当前笔、留在当前交易，不引入 Tip Summary，保存时直接更新交易金额。本轮已取代该行为：SAVE 保存待执行值，Process 才更新小费和总额；项目仍是浏览器原型。

现有领域约束保持为讨论基线：当前未结算批次、符合条件的银行卡 Sale、不含 Capture；Tip Amount 覆盖原小费；固定 Transaction Amount 加输入小费得到 New Total；零值和原值也允许确认。交易切换使用进入编辑时的筛选/搜索队列，首尾不循环。

## 当前确认的交互与术语（以第二轮澄清为准）

- SAVE：保存到待执行队列；不改变已生效金额。
- UNADJUSTED：尚未保存调整值、仍可处理的交易。
- ADJUSTED：小费调整值已保存，等待执行。离开本模块后保留该值和状态。
- 执行成功：更新已生效金额，从整个 Tip Adjust 界面（包括 All 和 Adjusted）移除；普通交易记录及报表仍保留。
- 筛选仅 All / Unadjusted / Adjusted，不增加 SAVED 状态或筛选项。
- 列表右上角 Review (N)：进入当前批次全部待执行项目的 Tip Summary；搜索/筛选只影响浏览。
- Summary 展示小票、时间、小费旧值/新值、新总额、笔数及金额；Process N adjustments 执行。
- 保存待执行值时，Transactions、批次已生效金额和小票保留成功金额；处理成功后更新。

用户确认 SAVE 待执行 → Summary → Process 流程和 A 布局，并明确 ADJUSTED 表示已保存，执行成功不再出现在 Tip Adjust。该定义取代第一轮曾建议的 SAVED / ADJUSTED 状态区分，CONTEXT.md 与 OPC_ATTD 实现均已同步。

## 三种编辑器布局草案

- A 单行导航：左侧 List，右侧上一笔/序号/下一笔；小号 Tip Adjust 位于内容区，原交易信息在金额上方。用户已选定。
- B 交易卡导航：轻量 List / Tip Adjust 顶栏；原交易卡内承载状态、时间、卡信息及切换控件。
- C 底部切换：轻量顶栏；金额优先、原交易信息居下，交易切换位于键盘下方。

预览中的三笔交易、两阶段状态和汇总为设计示例；所有执行仅改变预览内存，不代表渠道提交。预览未实现离开未保存输入时的确认弹窗，真实实现需沿用或重新确定现有保护。

## 已确定及沿用的边界

- 用户原请求为统一执行所有已保存调整；汇总范围为当前批次全部 ADJUSTED，不随浏览筛选或搜索缩小。
- SAVE 仍停留当前笔；进入编辑时固定浏览队列、首尾禁用；未保存输入离开时沿用 Keep Editing / Discard Changes。
- 保留确认零小费、原值的能力；执行成功前可再次修改保存值。成功后本模块不再提供该笔再次编辑入口。不能仅用金额是否变化判断是否存在待执行确认。
- 普通 SAVE 不更新已生效金额；本轮执行统一模拟成功，更新已生效金额后从整个 Tip Adjust 工作列表移除。
- Tip Adjust 只进行小费调整，不提供关批操作或 Discard Saved Tips & Close；关批仍由独立 Close Batch 执行。

## Close Batch 已确认流程

用户明确：不因存在待执行 Adjusted 阻止发起 Close Batch。关批时先提示将自动执行调整，并提示有多少笔交易没有设置调整金额；调整完毕后再关批。

1. 从独立 Close Batch 入口发起。
2. 确认提示同时列出待执行 Adjusted 的笔数，以及尚未设置调整金额的 Unadjusted 笔数。
3. 用户确认后，自动执行本批次全部 Adjusted；本轮原型统一模拟成功。
4. 调整成功的交易更新已生效金额并退出 Tip Adjust 工作列表；调整阶段结束后再进入批次结算，结算采用成功更新后的金额。
5. 未设置调整金额的 Unadjusted 只提示笔数，沿用已有金额，不自动填写或清零小费。保存过 $0.00 或原值的交易属于 Adjusted，不计入未设置笔数。
6. Tip Adjust 内仍不提供关批操作。

以上取代上一轮建议的“存在 Adjusted 时阻止关批”。正常顺序已确定，不再要求操作员必须先手动进入 Tip Adjust 执行。

## 原型范围与验收要点

用户明确“原型不用考虑执行失败”。执行失败、超时、部分成功和重试不属于本轮原型，不再作为待确认或实施前置条件。此前关于失败保留的讨论不要求在本轮建立失败分支。

- 列表展开 All / Unadjusted / Adjusted；右上 Review (N) 的 N 为本批次全部已保存待执行笔数。
- A 布局保留返回列表及交易切换；日期时间和状态均放在原交易信息区。
- SAVE 留在当前笔并显示 ADJUSTED；退出再进入保留保存值；零值与原值也可保存。
- 汇总列出当前批次全部 Adjusted；确认 Process 后全部模拟成功，从 All、Adjusted 及后续编辑队列中移除。
- Close Batch 先提示将自动执行的笔数和未设置调整金额的笔数；确认后先执行调整，再完成关批。
- 关批前仍为 Unadjusted 的交易沿用已有金额；关批后不会把旧批次的待处理列表带入新批次。

最新预览为 `output/tip-adjust-review/tip-adjust-confirmed.html`，仅展示上述正常流程；早期多方案及失败截图属于讨论历史，不作为最终验收依据。

## 设计预览验证

已在浏览器中验证 SAVE 后显示 ADJUSTED、手动执行三笔全部成功并移出列表、Close Batch 提示两笔待执行与一笔未设置、零小费已保存记录不计入未设置、自动执行后关批并进入空的新批次。预览在 320px 宽度无横向溢出，无页面脚本错误。上述验证针对早期设计预览，正式产品验证见下节。

## OPC_ATTD 实现与验证

- `attended_demo.js` 分离待执行的 `tipDraftCents` / `tipSavedAt` 与已生效的 `tipCents` / `amount`。成功执行记录 `tipProcessedAt`，从 Tip Adjust 资格范围中移除，但保留原交易与小票数据。
- 旧会话一次性迁移：保留原有已生效金额和历史，将原 ADJUSTED 记录以其已有小费值转为待执行状态；不重置用户金额、不重复补齐演示数据。仍使用现有标签页 `sessionStorage`。
- `attended_tip.js` / CSS 实现 A 单行导航、时间与交易状态、展开筛选、Review、Tip Summary 与成功结果页。沿用金额键盘、固定编辑队列和未保存离开提示。
- Close Batch 保留原有 OPEN AUTH 提醒；最终确认后先执行全部 Adjusted 再生成批次快照，结算结果金额读取更新后的快照。
- `node --test OPC_ATTD/tests/attended-prototype.test.cjs`：14/14 通过，涵盖原有授权、Capture、Void、现金与批次规则，以及新的保存/执行分离、迁移、刷新不回填、零值、自动调整后结算。
- 实际页面浏览器验收：初始 All 20 / Adjusted 10 / Unadjusted 10；001105 从原小费 $1.25 保存为 $5.00 后，仍留当前笔，原金额暂不变；退出和刷新保留，未保存切换保护正常。
- 搜索只显示一笔时，Review 仍显示本批次全部 11 笔 Adjusted；汇总显示 $1.25 → $5.00、新总额 $39.22；执行后仅剩 9 笔，刷新不重新出现。Transactions 列表及其详情弹窗、Batch Reports 同步已生效金额。
- 独立会话关批验收：001051 保存 $8.00，另保存一笔 $0.00；提示 12 笔自动执行、8 笔未设置。取消不执行；确认并通过既有 OPEN AUTH 提醒后，关批成功，结算金额比原值增加 $7.35，新批次 2072 的 Tip Adjust 为空。
- 320px 实际列表和编辑器无横向溢出，SAVE 可用；浏览器无页面脚本错误，JS 语法与 `git diff --check` 通过。未部署。

截图：[列表](revision-4-list.png)、[编辑器](revision-4-editor.png)、[Tip Summary](revision-4-summary.png)、[关批确认](revision-4-close-confirm.png)、[结算结果](revision-4-settlement.png)、[320px 编辑器](revision-4-editor-320.png)。
