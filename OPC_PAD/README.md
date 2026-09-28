# OPC PAD

横屏顾客支付原型，按 OPC_ATTD 的支付卡片、小费、签名和小票界面移植。设计约束见 [AGENTS.md](AGENTS.md)。

## 启动

仓库根目录执行 `python3 -m http.server 8765 --bind 127.0.0.1`。

先打开 **[收银机与设置页](http://127.0.0.1:8765/OPC_PAD/launcher.html)**，选择设备分辨率及示例订单，点击 **Send transaction**，在独立标签页打开顾客主屏，收银机页保留；后续交易复用顾客页。

顾客入口：<http://127.0.0.1:8765/OPC_PAD/index.html>。

## 演示操作

- 收银机页集中提供 1600×720 / 1920×1200、左右布局、小费开关、Dual Pricing 开关、信用卡签名及模拟 Approved/Declined 设置。
- 小费：15/20/22/25%，Custom Tip 数字键盘，No Tip；选择后确认，再进入支付方式。
- 支付方式：DEBIT SALE、CREDIT SALE、CASH、WALLET，每张卡直接显示本方式金额。
- 银行卡：TAP CARD 无按钮等待 5 秒 → 自动模拟结果 → 信用卡可选签名 → Approved。图标参考 `18.tapcard.html` 使用深色显示。
- 银行卡页不需要顾客手动点击，不提供切换方式；签名仍需在画布书写，可 Clear 重写，空签名不能确认。签名页 Clear / Confirm 沉底，签名画布扩展占用剩余高度。
- WALLET：通用钱包 Pay → Processing → Approved / Declined，不显示银行卡操作。
- CASH：等待收银员确认。在保留的收银机页点击 Confirm cash received，结果同步到顾客页，不跳转或刷新。
- 未完成交易可以在收银机页取消；已批准进入签名后不再作为未支付交易取消。
- 成功、失败和取消均显示 `OK(10s)`，每秒递减；点击 OK 或 10 秒结束均回广告待机页。失败保留 ATTD 红色结果按钮，成功和取消使用蓝色按钮。
- 成功页暂时移除整个 CUSTOMER COPY 模块，包括 Email 入口和邮件表单；保留交易摘要、支付凭证及沉底的 OK(10s)。
- 布局交易中保存、待机时生效；其他设置下笔交易生效。

## 设备画布

主页面的设计尺寸固定为选定的 **1600×720 或 1920×1200**，并分别配置间距、文字、按钮和明细行高度。外层深色浏览器预览自动等比缩小，最大 1:1，保留边框；不会按任意浏览器宽高拉伸设备内容。顾客画布没有顶栏、底栏、设置、演示按钮和额外副标题。

原生 1:1 截图验证使用设备尺寸外加 64px 的浏览器视口（1664×784、1984×1264），另检查较小浏览器中的缩放。

## 金额规则与边界

- 原项目事实：OPC_ATTD 的 tip.html 先把小费加入现金金额，cash_discount.html 再计算 `round(cashCents * 1.04)`。
- 本原型决定：DEBIT / CREDIT 均映射银行卡价；WALLET 暂用现金基础价，未假设服务商收费规则。
- 关闭 Dual Pricing 时四方式同价。所有金额以整数分计算，不同方式价格只出现在方式卡，商品区显示单一 Total，并在选择后与所选金额、结果保持一致。
- 示例 USD 商品、优惠、8% 税率只用于演示，不代表税务或支付服务规则。
- ATTD 当前 CARD 路由直接到 receipt.html；PAD 呈卡页参考 `18.tapcard.html`，5 秒自动结果为补充的模拟流程。
- 本项目无真实收银机、支付、硬件、打印、邮件集成；交易与设置仅保存在本浏览器中。原型尚未外网部署。

## 验证

运行 `node --test OPC_PAD/tests/model.test.cjs`（仓库根目录）。浏览器证据见 [validation/README.md](validation/README.md)；本轮成功页与签名页的两种尺寸验收位于 `validation/v8/`，三种结果倒计时见 `validation/v6/`。

## 素材

Inter：SIL Open Font License，见 `assets/Inter-LICENSE.txt`。

`merchant-default.svg`、银行卡品牌及 `tap.svg` 素材复制自 OPC_ATTD。

广告图片为本地样图：
- https://images.unsplash.com/photo-1542838132-92c53300491e
- https://images.unsplash.com/photo-1509042239860-f550ce710b93
- https://images.unsplash.com/photo-1509440159596-0249088772ff

支付方式选择页去掉商户图标，扩大支付卡及全宽 Change Tip；待机不显示额外等待提示语。
