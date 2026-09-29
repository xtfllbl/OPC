---
status: accepted
---

# Tip Adjust 分离保存与执行

为支持收银员先连续录入小费、再核对并统一执行，Tip Adjust 将 SAVE 定义为保存待执行值，界面使用 TIPPED 表示已保存，而不是渠道执行成功；执行成功的交易退出该模块的工作列表，原交易记录与报表仍保留。执行前的保存值与已生效金额分开，避免待执行值提前影响交易和批次财务金额。

独立 Close Batch 在提示待执行笔数及未设置调整金额的笔数后，先自动执行已保存调整，再结算批次，避免要求操作员额外返回 Tip Adjust 手动执行。本轮原型仅模拟成功路径，已在 OPC_ATTD 实施。

2026-09-29 用词更新：原 Adjusted / Unadjusted 分别改为 Tipped / Un-tipped，分类仍取决于是否已保存调整值；保存零小费也属于 Tipped。Tip Summary 使用 Tip Adjust Count 与 Tip Adjust Total，分别表示待执行交易笔数及这些交易保存后的小费合计，不新增批次小费合计。保存与执行分离的决定不变。

2026-09-29 示例数据修正：用户确认未保存交易的示例小费统一为零，Total 等于 Amount；继续按 SAVE 分类，保存零小费仍进入 Tipped 和 Review。本次修正演示数据及旧会话中未操作的对应样例，不改变 SAVE → Review → Process 流程。
