# OPC_ATTD

有人模式交互原型。线上地址：<https://opc-attd.vercel.app>。

## 本地预览

在此目录执行 `python3 -m http.server 8765 --bind 127.0.0.1`，访问 <http://127.0.0.1:8765/>。

## 发布到 Vercel

- 项目：`xtfllbls-projects/opc-attd`
- 部署根目录：`OPC_ATTD/`
- 框架：静态 HTML/CSS/JavaScript，不需要构建。
- 默认入口：`index.html`；保留 `.html` 路由。
- `tests/`、本文及本地部署关联不上传。

从本目录执行：

```sh
node --test tests/attended-prototype.test.cjs
vercel --prod --yes --scope xtfllbls-projects
```

其他电脑首次发布时，先执行：

```sh
vercel link --yes --project opc-attd --scope xtfllbls-projects
```

仓库根目录的 Vercel 关联属于另一个项目 `opc-ev-pilot`。上述命令应在 `OPC_ATTD/` 内执行。

## 首次发布验收

2026-09-25：生产部署 `dpl_AkPBRcHdvFudpg4oSWjVYUrUg9ev` 为 READY；正式域名返回 HTTP 200；29 个 HTML/CSS/JS 文件与本地逐字节一致；测试文件返回 404。线上浏览器已核验默认首页、操作菜单、追加授权寻单和 OPEN AUTH 列表。

新增流程使用浏览器本地演示数据；部署不代表真实支付、密码权限、邮件或硬件打印接入。
