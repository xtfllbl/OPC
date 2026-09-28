# Tip Adjust 第二轮调整与验收

状态：用户已确认推荐方案，已完成本地实现与验收，未部署线上。

## 参考与边界

参考 [Dejavoo POS Tip Adjustment](https://knowledge.ipospays.com/ipospays/how-to-adjust-tips-on-ipospays#tip-adjustment-on-the-payment-terminal-pos) 的交易切换控件。官方步骤 2 截图显示左右箭头及 1/3、2/3 位置计数。官方 OK 后进入 Tip Summary；本项目按用户要求采用 SAVE 保存当前笔，不引入该汇总提交过程。

本轮取代上一版的 Sale/Capture 范围和 Save & Next / Save & Return 交互。上一版实现与验收记录保留为历史事实。

## 用户已明确

1. 已调整/未调整用类似 Transactions 的明显状态徽标区分。
2. 仅对当前批次支持小费后调的银行卡 Sale 开放，Capture 不参与。列表、筛选、计数、可调交易小费合计及关批未调整提醒采用相同资格范围；批次财务汇总仍反映真实已有交易金额。
3. 编辑器增加独立交易切换控件。
4. FINAL TIP AMOUNT 改为 TIP AMOUNT，删除 Current tip。
5. New Total 使用现有页面的紫色突出显示；仍按固定 Transaction Amount + 输入的 Tip Amount 计算。
6. 键盘提交键改为 SAVE，仅保存当前笔，不自动切换交易。
7. 删除 Save & Return to List，返回由左上角返回键完成。
8. 保持现有项目设计语言与金额键盘。

## 已确认的呈现

- 使用“上一笔 — 当前/总数 — 下一笔”切换条，首尾禁用对应箭头，不循环跳转。
- 列表徽标使用 ADJUSTED / UNADJUSTED，已调整沿用绿色；未调整用同形状的琥珀色，避免与 OPEN AUTH 混用。位置放在金额/小费下方，对齐 Transactions 的状态位置。
- 编辑器保留顶栏 Tip Adjust，移除内容区重复大标题，减少上下留白；保留小票号、卡尾号、Transaction Amount、Tip Amount 和紫色 New Total。
- 保存成功留在当前交易，更新金额、确认状态及可再次保存所需的版本；失败保留输入。确认零小费/原值仍算已调整。

## 已确认的交互决策

- 范围：Sale only（已定）→ 所有资格计数一致（适用）；真实批次金额不删除 Capture。
- 保存：仅当前笔（已定）→ 成功留在当前笔（已定）；切换由独立控件执行（已定）。
- 导航：箭头+计数（已定）→ 未保存输入提示继续编辑/放弃修改（已定）。
- 导航队列：沿用进入编辑时的筛选/搜索结果（既有方案）→ Unadjusted 筛选下保存后仍可用上一笔回看（已定）。

### Q1 未保存输入切换

沿用返回时的 Keep Editing / Discard Changes 提示；继续编辑保留本笔输入，放弃修改才切换。只有 SAVE 保存，不跨交易保留未提交草稿。

### Q2 保存后的队列

固定进入编辑时的筛选/搜索队列，保存后留在原笔；上一笔/下一笔可回看本轮刚保存的交易，返回列表时再刷新筛选。首尾禁用对应箭头，不循环。

## 验收记录

- 数据回归测试 9/9 通过，覆盖 Sale 资格、Capture 排除、金额覆盖、保存失败、结算快照和既有支付流程。
- 浏览器从 Unadjusted 的两笔 Sale 进入 1 / 2；将 001051 的小费先保存为 $5.00，再保存为 $6.00，均留在本笔，最终总额 $110.00，无版本冲突。
- 再输入 $7.00 点击下一笔：Keep Editing 保留 $7.00；Discard Changes 跳到 2 / 2；上一笔回看仍是已保存的 $6.00。
- 第一笔的上一笔、最后一笔的下一笔均禁用；返回列表后 Unadjusted 只剩 001048 一笔。
- All 列表仅有两笔 Sale，分别显示绿色 ADJUSTED 和琥珀色 UNADJUSTED；Capture 不进入列表及待处理计数。
- 关批只提醒剩余 1 笔 Sale；该笔 SAVE 为 $0.00 后，未调整笔数清零，返回仍为原 OPEN 批次，关批恢复正常确认。
- 原生键盘保留；金额区使用 TIP AMOUNT，无 Current tip、重复大标题或 Save & Return；New Total 为项目既有紫色，提交键仅为 SAVE。

截图：[新版列表](revision-2-list.jpg)、[新版编辑器](revision-2-editor.jpg)。
