# 0002. OPC_ATTD 异常流与失败路由容错规范

在 Paywizard POS 模拟引擎中，特定测试金额（美分以 4 结尾，如 $0.64）会确定性触发交易冲正与失败流程。原单体应用中的失败页 `6_receipt_failed.html` 在重构为 `OPC_ATTD` 时未被纳入，导致触发失败测试时出现 404 Cannot GET 错误。

我们决定在 `OPC_ATTD/` 建立规范命名的失败凭证页 `receipt_failed.html`，并在 `receipt.html` 中统一调用规范路径；同时生成 `6_receipt_failed.html` 别名页面进行无缝重定向，对历史硬编码链接与外部书签提供双重兼容兜底。针对 `transaction_detail.html` 中可能触发的 `9_void_confirm.html` 遗漏路由，同步补齐对应的容错处理。
