# Paywizard 改造清单：终端交易共享与后续操作支撑

日期：2026-09-28；版本：v1.0

关联：[总体方案](README.md) · [OPC 终端改造清单](terminal-changes.md)

## 1. 职责与现有能力

Paywizard 接收终端已经执行的交易，提供同 MID 查询、原交易上下文、权限、操作协调、结果归并及批次查询。实际 Sale、Refund、Void、Capture、Auth-Incremental、Close Batch 均由终端直连 processor。不得把本次功能接入现有“平台代调用第三方退款”的路径。

本地静态核查确认：

| 能力 | 现有入口/实现 | 本次复用方式与边界 |
| --- | --- | --- |
| 交易分页 | /sysTransLog/queryPages、/queryTranLogPagesV2 | 复用查询服务；增加终端身份、授权范围和轻量返回；V2 当前限制最多三个月查询跨度 |
| MID/TID/SN 过滤 | QueryTransLogDTO、MrtTranLogMapper、SysTransactionLogServiceImpl.queryPages | Service 将 sn 转为 snList；复用筛选，但不能让客户端指定任意授权范围 |
| 交易回传 | /sysTransLog/upload、/updateTransInfo、/updateTerminalTransInfo | 各版本保留兼容；增加统一事件接收与字段适配，不能假设报文完全相同 |
| 已有存储去重 | saveTerminalTransLog、saveTerminalCashierTransLog | 存在 paywizardId + tranOrderNo 查重逻辑；不代表已有 eventId 级并发幂等和不可变事件处理 |
| 交易上下文字段 | TransLogDTO 中 MID/TID、rrn、authCode、trace、oriTransIndexCode 等 | 已有字段可映射；是否足够跨终端执行仍按通道验证 |
| 批次/结算回传 | /sysTransLog/uploadSettlementInfo、/mrtSettlementReport 下各结算回传版本 | 复用存储和适配；补 Open 快照、版本、明细完整性与幂等 |
| 批次查询 | /mrtSettlementReport/queryForPage | 复用现有查询，增加终端侧只读 API |
| 现有退款 | /opc/refundTransaction、/sysTransLog/semiOrderRefund | 属于其他执行链路；不能作为本方案支付执行接口 |

上述入口是否适用于现网设备认证、数据完整性和运行时权限，仍需联调。本次只证明源码存在，不把 Controller 接收 SN 或 MID 等同于完成了设备鉴权。

## 2. 改造项目总表

“基础必做”指共享查询之前完成；“操作必做”指跨终端资金操作开放之前完成。

| 编号 | 改造项 | 类型 | 时点 | 对应终端项 |
| --- | --- | --- | --- | --- |
| PW-01 | 设备身份、收单账户和 MID 范围解析 | 扩展 | 基础必做 | OPC-04 |
| PW-02 | 终端侧权限、配置与功能能力 | 扩展 | 基础/操作必做 | OPC-04、OPC-13 |
| PW-03 | 统一交易身份与关联数据模型 | 扩展 | 基础必做 | OPC-02、OPC-10 |
| PW-04 | 可靠、幂等的交易事件回传 | 扩展 | 基础必做 | OPC-03 |
| PW-05 | 同 MID 分页查询与搜索 | 扩展 | 基础必做 | OPC-05 |
| PW-06 | 统一详情、交易链与动作解释 | 扩展 | 基础/操作必做 | OPC-06、OPC-07 |
| PW-07 | 后续操作登记与在线并发协调 | 新增逻辑能力 | 操作必做 | OPC-08 |
| PW-08 | 原交易执行上下文与通道能力矩阵 | 新增/扩展 | 操作必做 | OPC-09 |
| PW-09 | 操作结果接收、未知状态与乱序归并 | 新增/扩展 | 操作必做 | OPC-10、OPC-11 |
| PW-10 | Open/Closed 批次快照与明细接收 | 扩展 | 基础必做 | OPC-12 |
| PW-11 | 各终端批次只读查询 | 扩展 | 基础必做 | OPC-12 |
| PW-12 | 数据变更游标与更新通知 | 新增/扩展 | 游标必做，推送可后置 | OPC-03、OPC-05 |
| PW-13 | Portal 交易、批次和异常呈现 | 扩展 | 试点前 | OPC-10、OPC-17 |
| PW-14 | 审计、敏感字段隔离与留存 | 扩展 | 基础/操作必做 | OPC-13、OPC-17 |
| PW-15 | 服务隔离、容量及可观测性 | 扩展 | 试点前 | OPC-15、OPC-17 |
| PW-16 | 历史数据、旧终端兼容与灰度 | 扩展 | 试点前 | OPC-16 |

## 3. PW-01、PW-02：身份、范围、权限

### PW-01：从可信设备身份推导查询与上传范围

需要做：

1. 将请求设备映射至 tenant/paywizardId、storeId、deviceId/SN、acquiringAccountId、processor、环境、MID、TID 及有效绑定版本。
2. SN 是设备标识，不是密码；在现有终端认证机制上验证设备凭据、请求完整性与防重放能力。具体沿用哪种证书/签名机制在接口评审中确定。
3. 查询 MID 必须属于该设备有效收单配置及授权范围。相同 MID 字符串不能跨租户、processor、测试/生产环境自动合并。
4. 交易上传以经过验证的执行设备身份为准，校验历史绑定与交易发生时的配置；不能因设备今日换绑就把昨日待回传交易记入新商户。
5. 查看原交易的权限、读取执行上下文的权限、提交后续结果的权限分别校验。
6. 将终端查询入口与 Portal 交互入口区分，但复用底层服务；禁止把 Portal appType/platId 直接当终端授权依据。

验收：修改客户端 MID、SN、tenantId、operationId 不能越权；换绑后旧缓存及旧事件不会进入新 MID；过期/无效设备身份返回明确错误而不是空列表。

### PW-02：发布终端能力与权限

需要做：

- 返回当前 MID 可见终端列表，以及 VIEW_TRANSACTIONS、VIEW_BATCHES、REFUND、VOID、CAPTURE、INCREMENTAL_AUTH 等操作授权。
- 返回按 processor、商户配置、原交易类型、支付方式、SDK/固件版本确定的能力，不设置一个覆盖所有通道的 crossTerminal=true 总开关。
- 管理员现有配置的 Void/Refund/Close Batch 独立 Manager PIN 要求继续生效；Capture/Incremental 不无故新增 PIN。
- 云端只接受可信原生层/既有授权机制产生的操作证明，不能信任网页提交的 pinPassed=true；不在日志或普通查询响应中传输明文 PIN。
- 权限刷新失败不让已配置且凭据有效的本机收款依赖平台。权限缓存的有效期、撤销和换绑行为须与既有设备管理机制对齐。

验收：只有查看权限时能浏览但不能 prepare；有操作权限者按既有密码规则执行；无平台连接仍能使用合法的本机功能，跨终端 prepare 必须在线。

## 4. PW-03、PW-04：数据身份与可靠回传

### PW-03：建立原交易与后续操作的稳定关联

以下为逻辑字段，不要求重建全部现有表；优先扩展现有交易/订单记录并增加必要的事件与操作记录。

| 对象 | 必须表达的字段/信息 | 约束 |
| --- | --- | --- |
| Transaction | transactionId、clientTransactionId、rootTransactionId、parentTransactionId、transactionType | transactionId 为全局业务标识；收据号不作为主键；退款引用实际被退付款，root 追溯整条链 |
| Scope | tenantId/paywizardId、storeId、acquiringAccountId、processor、processorEnvironment、MID、currency | 由可信绑定推导并保留交易发生时的快照 |
| Device attribution | originDeviceId、originTid、executionDeviceId、executionTid、deviceBindingVersion | 原交易设备与后续执行设备独立，后续操作不能覆盖原归属 |
| Processor reference | processorTransactionId、RRN、STAN/trace、authCode、originalDate、原通道所需的其他字段 | 均按通道版本定义；RRN 或 authCode 单独不保证全局唯一 |
| Amounts | amountMinor、currency、currencyExponent、base/tip/fee 等必要分量 | 最小货币单位整数；大整数建议 JSON 十进制字符串；不得默认所有币种两位小数 |
| Execution state | resultStatus、processorResponseCode、processorOccurredAt、evidenceSource | APPROVED/DECLINED/UNKNOWN 等独立于上传状态 |
| Business projection | authorizedAmount、capturedAmount、refundedAmount、业务状态及可用动作 | 基于已确认事件及通道语义计算；原交易金额不被 Incremental 直接覆盖 |
| Synchronization | eventId、operationId、deviceSequence、recordVersion、receivedAt | receivedAt 不替代交易时间；recordVersion 是平台版本，不冒充 processor 版本 |
| Operation | operationId、root/parentTransactionId、action、amount、executionDeviceId、状态、时间及结果引用 | 在请求 processor 前生成，重试不能换 operationId |
| Batch | batchUid、processorBatchNumber、batchOwner、batchGeneration、currency、status、snapshotRevision | batchUid 全局唯一；不同终端同批次号不合并；批次归属由通道结果表达 |

建议业务账本按交易链保留 Sale/PreAuth 原始事实，并为每次 Refund、Void、Capture、Incremental 建立独立结果记录。列表可展示聚合状态，但审计和金额统计必须能还原每次操作。

### PW-04：逐事件幂等接收

需要做：

1. 新增/适配统一事件入口，支持批量上传，每个 eventId 独立返回 accepted、duplicate、rejected 或 retryable。
2. 对 eventId 设置持久唯一约束；同时记录规范化 payload 摘要。同 ID 同内容重传返回原确认，同 ID 不同内容报冲突。
3. 设备上传认证、金额、原交易关联、记录归属校验通过后，先提交持久事务，再返回确认；仅进入内存队列不算接收成功。
4. 基础事件持久接收与查询投影可异步：返回 ingestStatus 和 projectionStatus，不将“接收成功”描述为“所有查询索引已更新”。
5. 后续记录先到时允许持久接收为 WAITING_PARENT，等待父交易补齐；不丢弃合法事件，也不编造父交易。
6. 区分结果事件、结果修正事件和 Open Batch 快照。支付结果保留审计历史；迟到旧数据不能覆盖新确认结果。
7. 邮件、签名图、小票存储、搜索索引等副作用独立重试，并用事件/交易标识去重；不能因邮件失败要求重新执行支付。
8. 现有 upload 家族通过适配器映射到统一逻辑。核查显示旧 saveTerminalTransLog 有 amount × 100，Cashier 分支直接保存 amount；逐版本验证入库单位，不能做全局统一乘 100。

验收：响应丢失后重复上传无重复账；批量中一条错误不使其他已接收事件反复失败；同 ID 异内容有明确错误；旧接口金额和原报表保持一致。

## 5. PW-05、PW-06：共享查询与详情

### PW-05：终端专用分页查询

- 条件支持授权账户/MID、全部或指定设备、日期范围、交易类型、支付状态、收据号、卡号后四位和金额。
- 卡号后四位仅用于检索，不能唯一定位执行目标；遇到相同收据号显示终端、日期和金额让用户选择。
- 使用稳定排序与游标，建议 occurredAt + transactionId，配合读取快照边界；新写入不导致翻页重复。
- 返回轻量列表字段、nextCursor、hasMore、serverTime、数据读取时间及同步完整性说明；不在列表返回支付执行上下文。
- 默认不为每页计算高成本精确总数。终端展示“已加载 N 条”；精确计数如需提供，应与列表筛选一致。
- 列表允许读库/索引；操作准备读取权威业务存储，不能复用当前标有 SLAVE_READ 的查询路径做资金状态检查。
- 保留现有时间跨度限制的兼容策略；新增终端接口可分段检索，不要求一次拉完多年历史。

验收：租户/MID 隔离正确；持续写入下分页稳定；已上传与本机待同步不重复；查询超时不产生“没有交易”的假象。

### PW-06：统一详情与动作资格

详情返回原交易及关联操作、原/执行终端、processor 结果、批次关联、最新已知金额和记录更新时间。

每个动作返回以下逻辑信息：

| 字段 | 用途 |
| --- | --- |
| action | REFUND、VOID、CAPTURE、INCREMENTAL_AUTH |
| available | 基于平台当前已知信息是否可进入操作 |
| reasonCode/reasonText | 权限不足、上下文缺失、通道不支持、操作处理中等 |
| amountConstraints | 最小/最大金额、是否支持部分金额；未知时不得编造可用余额 |
| requiresOriginalCard | 通道要求再次读卡时说明；未验证则不开放该执行路径 |
| recordVersion | 用于 prepare 检测用户查看后发生的变化 |
| stateAsOf / freshness | 说明平台状态来自何时、哪种证据 |

操作资格只是预检查，最终批准来自 processor；平台已知拒绝条件可以提前阻止，平台“可执行”不能绕过 processor 校验。

## 6. PW-07、PW-08、PW-09：跨终端操作协调

### PW-07：登记与状态机

建议逻辑状态：

~~~text
PREPARED → STARTED → SUCCEEDED
                  → DECLINED
                  → UNKNOWN → SUCCEEDED / DECLINED / VERIFIED_NOT_EXECUTED
PREPARED → CANCELLED_BEFORE_START / EXPIRED_BEFORE_START
~~~

- prepare：在主存储事务内检查身份、原交易版本、动作能力、已知金额及已有操作；按 rootTransactionId 协调互斥操作，返回绑定当前设备的上下文。
- 相同 operationId、相同参数重复 prepare 返回同一操作；相同 operationId 修改动作/金额/目标交易返回冲突。
- 建议同一交易链先串行处理资金变更，不为四种动作各加互不相干的锁。
- start：终端即将发送 processor 前调用，平台持久确认 STARTED 后终端才允许发送。start 响应丢失时查同一 operationId 状态，不能创建新操作替代。
- PREPARED 可过期的前提是终端协议强制“没有 start 确认绝不发送”；STARTED/UNKNOWN 不能仅凭超时自动解除阻塞。
- 用户在 start 前取消可释放平台预占；start 后需终端和 processor 结果证据，不能仅凭关闭页面取消支付。
- 服务端登记、超时任务或操作状态变更本身均不向 processor 发任何资金请求。

这些状态保证平台在线协调的可追踪性，不保证能阻止与平台失联的本机执行，必须与总体方案 G-04 的 processor 校验共同验收。

### PW-08：最小可执行上下文

需要做：

1. 将展示详情和执行上下文分离；仅在 prepare 成功后向有权限的 B 返回本次动作所需信息。
2. 绑定 operationId、原交易 ID、执行设备 B、动作、金额、币种、通道/环境和有效期；不能拿退款上下文用于 Capture。
3. 保留 originalTid、originalProcessorReference 与 executingTid 的区别。凭据由 B 的受信支付层按通道规范使用，不把 A 的密钥下发 B。
4. 如需要 token 或加密支付引用，验证其跨设备作用域和传输存储要求；不能把普通报表查询做成全量凭据分发。
5. 上下文不足的旧交易可查看并解释原因，不尝试用金额、收据号、后四位猜测缺失支付字段。
6. 维护能力矩阵：processor + environment + acquiringAccount + paymentMethod + originalType + operation + SDK/firmware 条件及验证版本。

特别注意：平台签发的执行许可只有终端原生层理解；除非 processor 协议明确支持，不能声称该许可可在 processor 端撤销、实现 fencing 或保证单次支付。

### PW-09：接收结果并恢复 UNKNOWN

- 成功、明确拒绝、未知结果都应可回传；未知不是失败，也不计入已成功资金金额。
- 回传携带 operationId、执行设备身份、processor 请求标识、结果证据及新的交易/批次引用。
- 支付结果与关联记录、原交易投影、预占释放应事务处理或采用可恢复的原子事件+投影机制，不能只改一半。
- 平台没有 processor 查询凭据时，由原执行终端调用 processor 查单并补传。普通数据刷新通知不得自动触发资金请求。
- 执行终端也离线时，保留 UNKNOWN；确需其他终端查单，必须先验证通道支持跨设备只读查单，不默认拥有该能力。
- 人工核实需记录 processor 证据、操作人、时间与原因；不能把“平台没收到结果”作为未执行证明。
- STARTED 后即使平台故障，终端可以上报已经发生的合法结果；不能因准备许可过期就丢弃历史支付事实。
- A 恢复上传旧记录时，不得覆盖 B 已确认的后续交易；业务投影按关联事实和通道语义归并，不按设备时钟最后写入覆盖。

验收：B 已成功、平台暂未知时不会释放为可重复退款；未知变为已确认时只计账一次；拒绝/未执行释放条件可追溯。

## 7. PW-10、PW-11：批次数据

### PW-10：接收并版本化批次快照

| 字段组 | 内容 |
| --- | --- |
| 身份 | batchUid、processorBatchNumber、batchGeneration、processor/环境、MID、TID、deviceId、currency |
| 快照 | snapshotRevision、snapshotAt、receivedAt、deviceSequence |
| 结果 | OPEN/CLOSING/CLOSED/UNKNOWN 等，processorCloseReference、closedAt |
| 汇总 | 按 Sale/Refund/Void/Capture 等类型的笔数与金额，净额计算口径 |
| 完整性 | summaryComplete、detailsComplete、expectedDetailCount、receivedDetailCount、detailSetVersion、detailDigest |
| 关联 | 明细中的 transactionId/clientTransactionId/processorReference，以及父交易引用 |

需要做：

1. Open 快照按同 batchUid 的 revision 更新，允许合并中间快照；Closed 作为关批事实持久保留。
2. 批次号可能轮换或重置，必须用 batchUid 和归属/代次区分；不能只按 batchId 去重。
3. 摘要与大批次明细分块接收，按明细集合版本、块 ID、数量/摘要校验完整性，重传不重复。
4. 已 Closed 后收到旧 Open 快照不回退；迟到明细可补齐，修正需保留来源。
5. 上传接口失败/处理失败的“平台接收结果”，与终端报告的“processor 关批结果”分开保存。
6. 已有 uploadSettlementInfo 在 finally 保存平台处理结果，且还有多组 settlementReport 入口；整合时要明确两种结果的含义与统一批次键。
7. PreAuth 不等于已结算收入；Void 不能简单作为再次负扣；现金与卡结算口径分开，延续现有业务规则。
8. 跨终端后续操作若改变 A 所属批次，而 A 未上传新快照，平台标记该快照可能落后。可关联新交易事实，但不能伪造 A 已确认的新汇总；等终端查单/批次刷新后核对。

### PW-11：提供只读跨终端批次查询

查询支持授权 MID、设备、Open/Closed、日期；详情返回汇总、明细、更新时间和完整性。

- 不提供终端 B 关闭 A 批次的 API；请求参数中也不接受可绕过限制的远程关闭动作。
- 不把终端离线显示为“没有批次”；展示最近收到的数据并标记更新时间。
- 不同币种分别汇总；多个终端相同 batchNumber 独立展示。
- 本期不将“批次已关闭”直接映射“已到账”；保留原财务结算状态。

验收：跨终端只读、快照不倒退、明细缺失可见、不同终端/币种不误合并。

## 8. PW-12 至 PW-16：更新、后台与运营

### PW-12：增量变化与通知

提供按授权范围的变化游标，包含交易/批次标识、平台版本、变更类型和必要的失效通知。使用平台提交顺序游标，不能仅按终端交易时间增量，否则漏掉迟到上传。

第一阶段以前台进入/恢复时刷新及增量拉取满足需求。SSE/WebSocket/已有推送可作为性能优化，消息只提示重新读取，断线后通过游标补齐。权限或设备绑定变化后旧游标/缓存失效。

### PW-13：Portal 页面与业务状态

在已有交易与批次页面增加：

- 原终端、执行终端、同一原交易的后续记录、operationId 等诊断信息。
- “平台收到的交易状态”和“结果待核实”，不把同步中显示成支付中。
- 设备最近回传时间与待上传数量（仅为上次终端报告，失联期间不能声称实时）。
- 批次 Open/Closed、快照更新时间、明细未齐及对账差异。
- 操作卡住的只读诊断和核实工作入口；人工修复不能自动发支付或仅为清除告警而伪造成功。

本次不新增 Portal 代执行支付、远程关批按钮，不扩大旧退款入口的适用范围。

### PW-14：审计与敏感信息

审计原交易、执行设备、已有人员身份、请求/响应摘要、状态变化与人工核实证据。展示 DTO 与执行上下文分离；日志默认脱敏，不记录 PIN、CVV、磁道、密钥或完整支付凭据。签名图片/完整小票独立授权访问。

删除缓存、迁移商户或清理历史记录，不能破坏仍处于待核实、未完成预授权或关联退款中的必要记录。留存时长沿用业务与通道约定，本方案不编造统一天数。

### PW-15：服务隔离、性能与监控

查询、事件接收、投影、图片/邮件、报表任务逻辑隔离；可先在现有应用内通过独立线程池/队列实现，不要求微服务拆分。

为租户/收单账户/MID/交易时间/稳定 ID、原交易链及批次归属建立经执行计划验证的索引。批次和列表避免逐行查设备信息；可复用现有批量设备信息加载方式。

监控接收成功率、重复/冲突事件、投影延迟、读库延迟、待核实操作数量与最老时间、批次明细不完整、按版本/通道的错误率。不得通过主动再次提交支付来“修复”监控指标。

### PW-16：兼容、迁移、灰度与回滚

1. 数据结构采用可兼容扩展；旧客户端继续上传，新增字段缺失时不编造引用。
2. 对历史记录建立可查看/可执行的完整性分类；无可靠原交易关联时保留旧记录，不能根据金额和后四位自动绑定。
3. 新老上传入口共享去重及关联策略，避免升级期间双写造成两条交易。
4. 功能按设备/MID/processor/动作逐项灰度，默认未验收能力关闭。
5. 回滚关闭共享/跨终端入口，不回滚或删除已发生的支付事实、待上传记录和 UNKNOWN 操作。
6. 旧终端不参与平台协调却仍可操作本机交易，必须包含在通道并发验证中。

## 9. 建议接口契约

以下路径均为**建议新增契约**，不是已存在 API；研发可沿用团队命名规范，但语义、幂等和鉴权要求必须一致。所有接口需要设备级认证；读取执行上下文和 prepare/start 额外检查操作权限。每次请求都校验服务器推导的 MID 范围。

| 方法与建议路径 | 作用 | 核心请求 | 核心响应 |
| --- | --- | --- | --- |
| GET /terminal-cloud/v1/context | 获取当前绑定与能力 | 可信设备身份、当前收单配置 | scope、设备列表、policyVersion、能力矩阵版本 |
| POST /terminal-cloud/v1/transaction-events | 回传交易结果/修正 | events[] | 每个 eventId 的接收/投影结果 |
| GET /terminal-cloud/v1/transactions | 同 MID 查询 | MID、日期、device、filter、cursor、limit | items、nextCursor、hasMore、asOf |
| GET /terminal-cloud/v1/transactions/{id} | 详情及交易链 | transactionId | 详情、关联操作、recordVersion、allowedActions |
| POST /terminal-cloud/v1/operations/prepare | 登记跨终端操作 | operationId、originalId、action、amount、expectedVersion | 操作状态、限定执行上下文、有效期 |
| POST /terminal-cloud/v1/operations/{id}/start | 执行前登记确认 | 操作 ID、准备版本/绑定凭据 | STARTED 状态及原登记结果 |
| GET /terminal-cloud/v1/operations/{id} | 恢复操作登记状态 | 操作 ID | 平台最新已知状态及是否待核实 |
| POST /terminal-cloud/v1/operations/{id}/cancel | 取消未开始操作 | 原因、操作 ID | 仅 PREPARED 可正常取消 |
| POST /terminal-cloud/v1/operations/{id}/result | 回传操作结果 | eventId、结果、processor 引用、新交易事实 | 幂等确认与投影版本 |
| POST /terminal-cloud/v1/batch-snapshots | 回传批次摘要 | batchUid、revision、摘要、明细集合元数据 | 逐快照确认与完整性 |
| POST /terminal-cloud/v1/batches/{id}/detail-chunks | 回传分块明细 | detailSetVersion、chunkId、entries、digest | 块确认、完成进度 |
| GET /terminal-cloud/v1/batches | 查询各终端批次 | MID、device、状态、日期、cursor | 批次列表与更新时间 |
| GET /terminal-cloud/v1/batches/{id} | 查询批次详情 | batchUid、明细游标 | 摘要、分页明细、完整性 |
| GET /terminal-cloud/v1/changes | 增量同步 | scope、changeCursor、limit | changes、nextCursor、hasMore |

operation result 与 transaction-events 如果上传同一份操作结果，必须共享 eventId 和同一接收服务，不能各自计账一次。操作准备接口不用于新增 Sale，也不作为本机离线后续操作的强制前置条件。

### 9.1 核心 TypeScript 类型草案

以下为设计结构，processor 扩展字段在各通道适配协议中补齐，不声明已经掌握全部报文字段。

~~~typescript
type MinorAmount = string; // 非负最小货币单位整数，如 "1000"；方向由交易类型表达
type Action = "REFUND" | "VOID" | "CAPTURE" | "INCREMENTAL_AUTH";
type ResultStatus = "APPROVED" | "DECLINED" | "UNKNOWN" | "VERIFIED_NOT_EXECUTED";

interface Money {
  amountMinor: MinorAmount;
  currency: string;
  exponent: number;
}

interface ProcessorReference {
  processor: string;
  environment: "test" | "production";
  referenceSchemaVersion: string;
  processorTransactionId?: string;
  rrn?: string;
  trace?: string;
  authCode?: string;
  originalTid: string;
  originalDate?: string;
  adapterFields: Record<string, unknown>; // 未定字段须通过各通道 schema 校验
}

interface TransactionEvent {
  schemaVersion: string;
  eventId: string;
  eventKind: "TRANSACTION_RESULT" | "RESULT_RESOLUTION";
  deviceSequence: string;
  clientTransactionId: string;
  operationId: string;
  parentTransactionId?: string;
  parentClientTransactionId?: string;
  rootTransactionId?: string;
  transactionType: "SALE" | "PREAUTH" | Action;
  money: Money;
  result: ResultStatus;
  processorResponseCode?: string;
  processorReference?: ProcessorReference;
  processorOccurredAt?: string; // 无时不伪造；另留设备时间与时区
  deviceRecordedAt: string;
  deviceBindingVersion: string;
  batchUid?: string;
  processorBatchNumber?: string;
}

interface PrepareOperation {
  operationId: string;
  originalTransactionId: string;
  action: Action;
  money: Money;
  expectedRecordVersion: string;
}

interface EventAck {
  eventId: string;
  ingestStatus: "ACCEPTED" | "DUPLICATE" | "REJECTED" | "RETRYABLE";
  projectionStatus?: "APPLIED" | "PENDING" | "WAITING_PARENT";
  transactionId?: string;
  recordVersion?: string;
  code?: string;
  retryAfterMs?: number;
}
~~~

返回原交易上下文时，将原始敏感引用交给受信支付层；普通网页仅接收不敏感字段或本机 contextHandle。传输如何绑定设备由既有终端信任机制实现，不把本示例结构直接当作可在浏览器长期保存的完整报文。

### 9.2 错误语义

| 业务错误 | 终端行为 |
| --- | --- |
| SCOPE_DENIED / DEVICE_BINDING_CHANGED | 停止对应云操作并刷新有效范围；不能回退他人缓存 |
| ACTION_NOT_SUPPORTED / EXECUTION_CONTEXT_INCOMPLETE | 可查看，解释动作不可执行 |
| STATE_CHANGED | 刷新详情并让用户重新确认金额/动作 |
| OPERATION_IN_PROGRESS / RESULT_UNKNOWN | 展示处理中/待核实，不新建重复操作 |
| IDEMPOTENCY_CONFLICT | 保留本机事件，进入诊断；不换 ID 自动再发 |
| RATE_LIMITED / TEMPORARILY_UNAVAILABLE | 查询/上传按提示退避；跨终端开始前失败则不执行 |
| PERMANENT_VALIDATION_ERROR | 停止该事件自动高频重试，保留原始本机记录供修复 |

HTTP 状态与业务码需要正式约定，兼容现有不同回传响应结构；终端不能只看到 HTTP 200 就判定成功。上述错误码是新契约建议，不冒充现有 ErrConstants。

## 10. 金额、时间与投影规则

- 新契约金额不使用浮点；服务端校验币种精度，适配旧金额单位时保留来源版本。
- 原交易金额不可被后续操作覆盖；每个后续操作有自己的实际批准金额。
- 可退余额依据实际可退款付款及已成功退款计算，并考虑已知未决操作；尚未回传的本机操作仍需 processor 最终校验。
- Incremental 请求金额明确为增量，不能与新授权总额混用。Capture 是否允许多次、超授权金额由通道决定。
- 保留 deviceRecordedAt、processorOccurredAt、receivedAt；排序和同步游标分别使用适合的时间/序列，不以设备时钟解决冲突。
- 新接口使用带时区的标准时间表达；“今天”按当前业务配置时区计算，Portal/终端展示一致。

## 11. 平台完成标准

- PW-01 至 PW-16 均有实现或明确的后置优化说明；所有基础/操作必做项不可略过。
- 接口契约、各 processor 引用 schema、旧版本字段与金额映射完成评审。
- 总体方案 E2E 中权限、回传、状态、批次、并发及回滚场景通过对应层级验证。
- 有证据说明未启用的 processor/动作及原因，不把“API 返回成功”当真实支付成功。
- 平台任何共享服务故障都不成为本机收款链路的同步阻塞点。

## 12. 建议研发任务拆分

| 工作包 | 包含项目 | 交付物 |
| --- | --- | --- |
| PW-A 身份与契约 | PW-01、PW-02、PW-08 | 设备范围、权限/能力与通道字段契约 |
| PW-B 数据回传 | PW-03、PW-04、PW-10 | 数据结构迁移、幂等事件接收、批次接收 |
| PW-C 终端查询 | PW-05、PW-06、PW-11、PW-12 | 查询/详情/批次/增量 API |
| PW-D 操作协调 | PW-07、PW-09 | prepare/start/result、未知恢复与并发控制 |
| PW-E 后台与上线 | PW-13、PW-14、PW-15、PW-16 | Portal、审计、监控、兼容和灰度 |

PW-A/B 可先开展，PW-C 基于稳定数据契约推进，PW-D 必须以通道能力验证为前提。

## 13. 不应直接复用的行为

1. /opc/refundTransaction 内部调用第三方退款，不能用于本方案的终端直连退款。
2. 读库分页结果不能当资金操作的最新权威状态。
3. 旧上传接口的金额处理不能未经核实复制到新报文。
4. 现有按订单查重逻辑不能替代事件唯一约束、并发事务与副作用去重。
5. 客户端上送的 MID/TID/SN/操作成功不能绕过身份、原交易关联和证据校验。
6. 平台协调锁或超时任务不能被描述为对所有直连 processor 终端具有全局互斥能力。

## 14. 现有代码定位

下列路径相对于 /Users/beaver/Paywizard/代码/paywizard/server；行号为本次核查快照的定位信息。源码存在不等于生产行为已验证。

| 文件 | 位置 | 证据 |
| --- | --- | --- |
| ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/controller/SysTransactionLogController.java | 103、135、158–180、226、281、337、485、620 行附近 | 查询、时间跨度、上传、已有网络退款和结算回传 |
| ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/service/impl/SysTransactionLogServiceImpl.java | 115–136、182–220、1141–1185 行附近 | 读库查询、SN 转列表、旧/新金额处理与查重 |
| ovstrade-core/src/main/java/cn/wizarovs/cloud/core/dto/QueryTransLogDTO.java | 38、62、75 行附近 | TID/SN/MID 筛选 |
| ovstrade-openapi/src/main/resources/mapper/MrtTranLogMapper.xml | 58、82–86、147、171–175 行附近 | 实际 SQL 范围过滤 |
| ovstrade-core/src/main/java/cn/wizarovs/cloud/core/dto/TransLogDTO.java | type、mid、tid、rrn、authCode、oriTransIndexCode 等字段 | 现有原交易/通道上下文字段 |
| ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/controller/OpcController.java | 478–539 行附近 | 按原订单查找并由平台调用 thirdRefund |
| ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/controller/MrtSettlementReportSummaryController.java | 46、64、91、123、139 行附近 | 结算回传家族和分页查询 |
| ovstrade-core/src/main/java/cn/wizarovs/cloud/core/dto/TerminalSettlementSummaryDTO.java | 14–57 行 | MID/TID、批次、币种、金额与结算状态 |
| ovstrade-core/src/main/java/cn/wizarovs/cloud/core/dto/QuerySettlementDTO.java | 19–39 行 | TID、日期与 MID 查询条件 |
