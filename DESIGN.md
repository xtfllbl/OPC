---
name: "Paywizard Configure"
description: "Configure 专属：简洁、清爽、无脑的 GO 中性原生系统风格。"
colors:
  ink: "#202024"
  muted: "#656b76"
  canvas: "#f5f6f8"
  line: "#e6e7e9"
  bound-surface: "#e0e8e1"
  positive: "#187454"
  negative: "#b23d35"
  surface: "white"
  configure-ochre: "#a16a22"
  input-border: "#d7d9df"
  placeholder: "#737780"
  primary-hover: "#36363d"
  secondary-hover: "#ecedf0"
  icon-hover: "#e9eaed"
  disabled-text: "#747985"
  progress-track: "#dedfe3"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-.9px"
  headline-results:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-.9px"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-.3px"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
  button:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  button-secondary:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.3
  tci:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    letterSpacing: ".8px"
  task-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  progress: "4px"
  compact: "12px"
  control: "16px"
  dialog: "24px"
spacing:
  compact: "8px"
  control-gap: "10px"
  related: "12px"
  text-gap: "14px"
  row: "16px"
  dialog-gap: "20px"
  section: "24px"
  results: "28px"
  primary-offset: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button-secondary}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    width: "100%"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.disabled-text}"
  button-retry:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.compact}"
    padding: "8px 18px"
  button-icon:
    textColor: "{colors.ink}"
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.compact}"
    minHeight: "44px"
  tci-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.tci}"
    rounded: "{rounded.control}"
    height: "62px"
  task-row:
    padding: "16px 0"
    textColor: "{colors.ink}"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "24px"
    width: "min(350px, calc(100vw - 32px))"
---

# Design System: Paywizard Configure

## Overview

**Creative North Star: "GO 中性原生系统风格"**

**范围：本文件只适用于 `27.device_manager.html` 与 `configure/`。即使位于仓库根目录，也不重新定义 `OPC_ATTD/`、`OPC_PAD/` 或其他根目录原型的设计系统。**

用户确认的体验是「简洁、清爽、无脑」。以 GO 的系统字体、近黑色操作、浅中性背景和克制边线组成清晰的终端界面。标题、输入和操作直接落在画布上；层级来自字号、间距和状态反馈。

这是对已实现静态原型的扫描记录。视觉来源为 `configure/app.css`，结构和状态来源为 `27.device_manager.html`、`configure/app.js`。当前已批准参考为 `docs/design/configure-go-2026-11-02/06-a-original-single-action.png`、`07-maintenance-home.png` 、`08-prebound-setup.png` 和 `09-maintenance-parallel.png`；该首屏构图的决定记录在 `.impeccable/configure-direction.md`。静态原型完成评审不代表真实终端集成或实体机视觉验收。

**Key Characteristics:**
- 系统字体与近黑主操作。
- 平面中性画布、白色输入和稀疏辅助文案。
- 进度及结果按任务呈现，颜色只辅助文字表达状态。
- 控制内反馈与减少动态效果支持。

## Colors

浅灰中性背景与近黑色控制形成主要对比；赭色只标识 Configure，绿与红表达状态，已绑定 TCI 使用浅绿色静态表面。

### Primary

- **近黑墨色（ink）**：正文、标题、主按钮、输入焦点以及进行中的任务进度。
- **Configure 赭色（configure-ochre）**：品牌下方产品名，不作为操作强调色。

### Neutral

- **浅灰画布（canvas）**：终端内容背景；桌面外部留白使用 line。
- **白色表面（surface）**：输入、次级按钮与对话框。
- **辅助灰（muted）**：标签、说明、版本和未完成任务阶段。
- **细分隔线（line / input-border）**：任务分隔、对话框边线，以及输入与底部终端信息的边线。
- **交互灰（primary-hover / secondary-hover / icon-hover）**：三种控件各自的悬停状态。
- **占位与禁用灰（placeholder / disabled-text）**：占位文本和不可用操作。
- **进度底色（progress-track）**：细进度轨道；也用于文本选区。

### State colors

- **成功绿（positive）**：单个任务成功后的进度填充和状态文字。
- **错误红（negative）**：错误字段边框、错误信息、失败任务阶段与进度填充。

## Typography

全界面使用前置 Apple 系统字体、随后 Segoe UI / Roboto / Helvetica / Arial 的系统无衬线栈。没有独立展示字体或等宽字体。数字通过 tabular-nums 对齐。

- **Headline**：初始两行标题；独立任务页使用较小的 headline-results 标题，首页保持 34px 标题。
- **Title**：Applications、Parameters 与对话框标题。
- **Body**：简短说明；对话框正文在同样字号下使用更宽松行高（1.5）。
- **Label**：字段标签。任务阶段、版本与底部标签也使用小字号，但权重与行高按各自用途处理。
- **Button / Button secondary**：统一尺寸，主按钮略重。
- **TCI**：较大数字；固定 TC 前缀另用稍重字重（650）。
- **Task title**：任务名，版本在同一行右侧以辅助色和普通字重呈现。

品牌 PAYwizard 使用（21px / 800），Configure 使用（15px / 650）。底部 S/N 使用（16px / 650）。这些是现有品牌与终端身份呈现，不是新的全局标题层级。

## Layout

桌面将终端画布居中，基准尺寸为（390 × 844px），受视口宽度与高度限制。界面纵向分为模拟状态栏、品牌、可滚动主区、底部终端身份与退出入口。主区常规水平内边距为（24px）；底部通过分隔线与主区区分，保留在滚动区之外。

首屏直接排布两行标题、TCI 标签与输入、一行说明、全宽主操作，不包外围卡片。输入高（62px），主操作最小高（52px）；标题上间距与主操作前间距均为（32px）。独立任务页标题缩小，结果区使用（28px）上间距；首页双入口按批准的 09 稿并排等宽：使用（32px）上间距、（14px）列间距、白底浅边框；按钮最小高（134px）、内边距（20px 18px），40px 下载包/参数滑杆图标和两行左对齐文字（18px / 650）。320px 小屏仍并排，列间距 12px、内边距 18px 14px、文字 17px；未完成提示留在对应按钮内，并让同排按钮等高增长。任务区之间为（24px），任务行上下内边距为（16px）。

- 宽度不超过（440px）：画布占满视口宽度与 100svh。
- 高度不超过（700px）：缩减状态栏、页头和页脚垂直占用，主区继续滚动。
- 宽度不超过（350px）：主区、页头和页脚水平边距改为（20px）；TCI 数字降至（21px），去除字距并缩减左内边距。
- 对话框宽度最多（350px），距视口左右各保留至少（16px）；高度受视口约束并允许内部滚动。

## Elevation & Depth

当前实现没有 box-shadow。画布、白色控件和细边线提供平面层级。对话框用半透明深色遮罩（rgb(20 22 28 / 42%)）隔开背景，保持白色表面与细边线，不增加悬浮阴影。

## Shapes

常规按钮、退出入口和输入采用 control 圆角；任务重试与选择框采用 compact 圆角，对话框采用 dialog 圆角。进度轨道细且端部圆润。正文内容与任务列表保持开放布局，不加独立卡片。线宽通常为（1px）；TC 前缀与数字区域用竖线隔开。

## Components

### Buttons

主按钮近黑底白字，次级按钮白底近黑边框，两者全宽、居中并采用相同内边距。最小高度为（52px）；实际高度可随文字增长。任务 Retry 是内容宽度、最小高（44px）的次级按钮变体。

悬停只改变背景；禁用状态统一为浅灰底、浅灰边线与禁用文字。键盘焦点采用近黑外描边（2px），偏移（4px）。背景与文字过渡为（160ms）。Setup 与两个维护入口有明确按下态：缩至 96%，Setup 底色加深，维护入口切换近黑底白字；按下过渡 60ms、释放过渡 160ms。快速点击/Enter 保留 140ms 可见反馈再进入任务页，同一反馈期间防止重复触发；减少动态效果时只变色，不缩放。

检查绑定与执行期间，主按钮在原位置显示状态文字和旋转指示，并隐藏箭头。指示器直径（17px），旋转周期（0.8s）。减少动态效果设置关闭旋转和过渡，文字仍说明正在执行的操作。

### Inputs / Fields

白色 TCI 输入带固定 TC 前缀和数字区。聚焦时边框变近黑并增加（1px）外描边；错误边框与错误说明使用 negative。禁用数字区透明度为（0.55）。已绑定时以浅绿色（#e0e8e1）静态身份块替换输入，块内只有 TCI 标签与完整 TC 值，不显示 Bound、勾、锁或数字键盘；身份值可选择复制。身份块使用 16px 圆角、14px 16px 内边距、12px 标签与数值间距。

绑定查询失败显示 Retry，不把失败当作未绑定。输入错误通过文字和 aria-invalid 表达，不能仅依赖红色。原生场景选择框只用于隐藏的原型演示对话框。

### Navigation

页头只保留双行品牌。退出入口移到底部：透明无边框，最小高 44px、24px 原有退出图标、16px 文字，图文间距 8px。独立任务页不显示 Exit、底部身份和分隔线；任务成功或明确失败后通过 Done 返回，失败仍保留 Retry。连续 120 秒无实质进展才出现 Back to home，恢复进展即隐藏。浏览器 Back 使用同一守卫，原生壳需接入该规则。标题保留程序化焦点定位但不绘制轮廓，真实控件仍显示键盘焦点。品牌默认无底色与边框，保留键盘焦点；长按或 Shift+Enter 打开演示场景。

### Task rows

Applications 和 Parameters 下使用开放列表，以细底边分隔。名称可换行，版本保持右侧；阶段文本与百分比在进度下方并列。轨道高（4px），填充以 scaleX 表示进度；变化过渡为（400ms cubic-bezier(.16,1,.3,1)）。完成变绿、失败变红，并保留阶段文字。

参数任务页的应用区标题为 Application check。已安装检查结果仅展示名称、当前版本和 Installed；下载应用时无更新显示 Up to date，不显示下载进度条与 100%。只有实际补装/更新应用展示完整进度，版本更新显示原版本 → 目标版本。

失败行显示局部 Retry，执行时禁用冲突操作。进度条具有名称、当前值和阶段说明，成功与失败通过礼貌实时区域播报。没有汇总进度或全局完成徽章。

### Dialogs

原生 dialog 承载退出风险确认和原型场景选择。白底、细边线、较大圆角与（24px）内边距；操作纵向排列，间距（10px）。退出确认保留 Stay here 与 Exit 两个清晰选择。组件预览只展示结构；真实模态焦点与遮罩由页面的原生 dialog 实现。

### Terminal identity footer

仅首页底部显示同一行的 S/N 和 Exit，二者垂直居中；左右边缘与分隔线及主区卡片对齐。删除 This terminal。S/N 默认 16px，350px 以下为 14px；Exit 保留至少 44px 高的点击区域。使用批准示例 WP6170PQ23000060；保留换行能力。它是终端身份，不是卡片或状态徽章。

## Do's and Don'ts

### Do:
- Do 仅在 Configure 范围内应用这些规则；其他原型遵循各自规范。
- Do 保持批准 A 首屏：独立输入、唯一 Set up terminal 主操作、底部 S/N WP6170PQ23000060。
- Do 保留加载、只读、禁用、错误、逐项成功与重试的可见差别，以及键盘焦点。
- Do 用任务文字和百分比伴随状态色；在减少动态效果设置下保留全部信息。

### Don't:
- Don't 将本文件中的 Configure 构图推广成 OPC_ATTD、OPC_PAD 或整个仓库的规则。
- Don't 给批准首屏补上外围表单卡片，或将 S/N 移到输入框下方。
- Don't 在首次配置完成前显示 Download apps 或 Update parameters；Don't 在首页展开旧任务进度。
- Don't 用蓝色主按钮、装饰阴影、总进度或汇总完成徽章替代当前实现。
- Don't 把模拟任务结果或文档组件预览描述成真实终端执行凭据。

## Approved refinement - 2026-11-03

The user approved `docs/design/configure-go-2026-11-03/approved-bound-tci-footer.png`: bound TCI uses a pale sage static block containing only TCI and its value, with no Bound badge, check or lock icon. Unbound input remains editable and white. The subsequently approved navigation refinement puts S/N and Exit on one centered footer row, removes This terminal, and removes the entire footer from task pages. This supersedes the earlier lock and header Exit appearance only.
