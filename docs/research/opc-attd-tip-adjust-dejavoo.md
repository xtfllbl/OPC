# Dejavoo POS 小费调整：参考事实与边界

核实日期：2026-09-28。研究问题：[核实 Dejavoo POS 多笔小费调整流程与证据边界](https://github.com/xtfllbl/OPC/issues/2)。

## 第一手依据

以 [iPOSpays 官方指南的 POS 部分](https://knowledge.ipospays.com/ipospays/how-to-adjust-tips-on-ipospays#tip-adjustment-on-the-payment-terminal-pos)为准；没有把 CloudPOS 或其他渠道行为套到 POS。

| 证据 | 可确认事实 |
| --- | --- |
| [入口截图](https://knowledge.ipospays.com/Adjust%20Tip/01.webp) | 首页星形按钮打开 Favorites，其中提供 Adjust Tip。 |
| [录入截图](https://knowledge.ipospays.com/Adjust%20Tip/02.webp) | 左右切换交易；显示交易序号、卡尾号、TPN、交易号、金额及小费输入，使用数字键盘。 |
| [汇总截图](https://knowledge.ipospays.com/Adjust%20Tip/03.webp) | 同时列出两笔：调整笔数 2、调整合计 $0.04；显示批次小费总额；右上箭头后再次确认提交。 |
| [成功截图](https://knowledge.ipospays.com/Adjust%20Tip/04.webp) | 成功提示提供 Done 和 Tipped Report。 |

正文将功能限定为已完成交易在批次结算前调整；POS 可浏览本 TPN 及同店其他 TPN。正文说 OK 进入汇总，但未完整展示多笔录入期间的保存顺序。[来源](https://knowledge.ipospays.com/ipospays/how-to-adjust-tips-on-ipospays#tip-adjustment-on-the-payment-terminal-pos)

## 证据结论

参考已证明“多笔分别录入后汇总提交”；未证明一键给全部交易套相同金额或比例。不能称其只支持单笔调整。

## 未验证事项

以下均不作为 Dejavoo 已确认行为，也不据此替 OPC_ATTD 决策：

- 已有小费时，输入值是最终小费还是追加差额；能否降低或清零。
- 下一笔是否自动保存、何时写入、退出是否保留草稿。
- 每类交易和卡种的资格、权限、小费金额限制。
- 提交部分失败、重复提交和重试语义。

## 与 OPC_ATTD 的关系

用户已确认的项目约束：本轮只形成方案；Tip Adjust 与 Close Batch 同级；当前批次列表中仅处理支持后调小费的银行卡 Sale/Capture；不同交易分别填写金额；每笔保存并可继续下一笔。

这些约束来自本项目讨论，不是外部资料事实。Dejavoo 的集中提交仅是参考差异，不覆盖已确认的逐笔保存方向。具体金额语义与边界应由后续决策票处理。本研究不实现产品代码，也不替其他决策票作结论。
