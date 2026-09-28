# OPC_ATTD Tip Adjust 实现与验收

2026-09-28，本地静态原型实现，未发布生产。

当前版本见 [第三轮实现与验收](revision-3.md)：移除 Done、补齐 20 笔 mock（初始 10 已调整 / 10 未调整）；编辑器沿用 [第二轮方案](revision-2.md)。下文保留第一版历史验收记录。

决策来源：[当前批次小费调整](https://github.com/xtfllbl/OPC/issues/1)、[业务规则](https://github.com/xtfllbl/OPC/issues/3)、[方案 A 与原生样式](https://github.com/xtfllbl/OPC/issues/4)。

## 入口与实现

- 操作菜单中 Tip Adjust 与 Close Batch 同级；设置页可单独配置 Tip Adjust PIN。
- `attended_tip.js` 实现列表、搜索/筛选、全页金额编辑器、连续保存和未保存退出提示。
- 键盘直接克隆首页键盘结构，沿用 `pos_home.css`；列表样式从现有 Transactions 提取至 `transaction_list.css`，两页共用，卡品牌资源共用。
- `attended_demo.js` 为金额、可调整能力、确认状态、批次数据和小票数据的共同来源。`transactionAmountCents` 固定；`tipCents` 每次覆盖；`tipConfirmedAt` 判断是否已处理。金额单位为分。
- 当前批次、APPROVED、card tender、Sale/Capture 且 `tipAdjustSupported === true` 才可调整。已知信用卡演示数据及新 Sale、支持的 PreAuth 后续 Capture 显式赋予能力；未知旧数据不自动猜测能力。
- 保存前重验资格和版本，存储成功后才替换数据；零值或原值确认有效，重复原值确认不重复记账。失败留在编辑器保留草稿。
- 新 Sale 的原始小费和费用通过付款路由传入记录。保持现有 Dual Pricing 金额算法；Tip Adjust 不重算交易金额与原费用。
- 小票 payload、打印模板和重打印事件携带最新金额与小费；硬件桥接仍沿用原接口。
- Close Batch 提示未确认笔数，支持先调整或继续结算；先调整默认筛选未处理，返回关批页不自动结算。既有 OPEN AUTH 提示保留。

## 验证

```sh
node --test OPC_ATTD/tests/attended-prototype.test.cjs
```

单元验证覆盖：原有授权/Capture/Void/关批/现金行为、资格排除、小费覆盖/降低/零值/原值、幂等确认、保存失败回滚、版本冲突、撤销/关批后拒绝保存、历史快照、新增交易分项。

浏览器手工验证记录：

- 菜单独立入口；原生金额键盘、列表和弹窗。
- 001051 从 $0.65 改至 $5.00，总额 $109.00，保存后跳 001048；确认其原小费 $10.00 后，两笔已处理，Tips $15.00。
- 关批提醒剩余 1 笔；先调整打开待处理 Capture；确认 $0.00 后待处理清零；返回仍为 OPEN 批次。
- 待处理清零后不再出现小费提醒，继续保留 12 笔 OPEN AUTH 提醒。
- 仍有 3 笔未确认时选择 Close Batch Anyway → Proceed Anyway，批次 2071 成功关闭；再次打开 Tip Adjust，2072 批次为空。
- 搜索小票号后队列缩小为 1 笔；再次编辑显示已保存值。
- 新建 Sale：$20.00 + $3.00 原小费，按原 Dual Pricing 支付 $23.92；后调为 $2.00 时固定交易金额 $20.92、总额 $22.92；原 Transactions 列表和详情同步。
- 独立 PIN 错误拦截、正确放行；会话内打开交易不重复请求 PIN；验证后恢复空 PIN。

验收截图：[列表](list.jpg)、[金额编辑器](editor.jpg)、[关批提醒](close-batch.jpg)。

## 原型边界

交易数据仍存于当前标签页的 `sessionStorage`；PIN 为浏览器演示配置。没有新增真实支付渠道、服务端权限、跨终端并发或硬件执行保证。真实接入需由交易接口返回可调整能力与固定交易金额，并以服务端保存结果及版本更新界面。
