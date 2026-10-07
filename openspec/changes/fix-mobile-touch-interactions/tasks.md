# Tasks: 修复移动端触控交互与面板适配

## 1. Approval

- [x] 1.1 确认提案范围与 Non-Goals
- [x] 1.2 确认「保留浮动文本输入框设计、只修触屏可达性」的方向（已确认）
- [x] 1.3 确认 16:9 默认值覆盖**所有图片模型**（已确认）
- [x] 1.4 确认 `arrow` 保持收在「更多工具」里，不改 `DEFAULT_VISIBLE_BUTTONS`（已确认）

## 2. 触控交互

- [x] 2.1 画布容器只对多指取消 `touchstart`，恢复单指的兼容 `click`（`react-board/src/hooks/use-board-event.ts`）
- [x] 2.2 文本浮动输入框：聚焦改到 `useLayoutEffect`，输入框给出可见光标宽度与淡边框（`drawnix.tsx`）
- [x] 2.3 「更多工具」嵌套箭头选择器加入 outsidePress 白名单（`more-tools-button.tsx`）
- [x] 2.4 外层面板忽略 `focus-out` 关闭请求，避免嵌套选择器抢焦点时整棵子树被卸载
      （`more-tools-button.tsx` + `popover.tsx` 的 `onOpenChange` 透出 floating-ui 的 reason）
      —— 这是 2.3 之外的另一半根因，2.3 单独不足以让箭头可用，见 5.12
- [x] 2.5 修 2.1 的副作用：`.viewport-container` 加 `touch-action: none`
      （`react-board/src/styles/index.scss`）
      —— 2.1 拿掉单指 `preventDefault()` 后，`overflow: auto` 的 viewport 容器被浏览器接管，
      单指拖拽被判成滚动手势、中途抛 `pointercancel`，画笔"画一笔断一笔"、矩形画不出来。
      不能退回 2.1 的写法（会连 `click` 一起掐掉，见 5.12 第一条），改由 CSS 挡：
      `touch-action` 不继承，`html/body/#root` 上的 none 覆盖不到这个滚动容器，必须它自己声明
- [x] 2.6 菜单里带子菜单的条目（「语言」「导出图片」）在触屏点不开
      （`components/menu/menu-item.tsx`）
      —— `MenuItem` 的子菜单只在 `onMouseEnter` 里开，触屏没有 hover 可依；
      而这一下 `click` 照样把「选中」事件冒泡给父 `Menu`，父菜单立刻整棵关掉，
      子菜单一闪即散。桌面靠 hover 先一步打开，所以一直没暴露。修法：触屏下这一下
      点击只负责开自己的浮层，并 `preventDefault()` 掐掉冒泡给父菜单的选中事件

## 3. 面板与预览适配

- [x] 3.1 `KeyboardDropdown` 按下拉左侧/右侧可用空间选边，修复右对齐触发器下的横向溢出
- [x] 3.2 同步 `KeyboardDropdown.test.tsx` 对 `menuStyle` 的断言
- [x] 3.3 `ttd-dialog.scss`：布局约束落到真实 DOM 类，删掉三个死选择器
- [x] 3.4 `ttd-dialog.scss`：`.ttd-dialog-panels` 可伸缩可滚动，`.ttd-dialog-panel` 补 `min-width: 0`
- [x] 3.5 `ttd-dialog.scss`：移动端把写死的 `height: 400px` / `height: 10rem` 改为可伸缩

## 4. 产品调整

- [x] 4.1 `image-aspect-ratios.ts` 增 `DEFAULT_IMAGE_SIZE`，`DEFAULT_ASPECT_RATIO` 改 `16:9`
- [x] 4.2 `model-config.ts` 各图片模型 `size` 参数默认值改用该常量（视频/音频不动；
      `gpt-image-2.5-1k` 只支持官方像素尺寸，退回横版语义 `1536x1024`）
- [x] 4.3 `feedback-button.tsx` 改用 `tdesign-icons-react` 的 `LogoWecomIcon`，删除 `icons.tsx` 的 `WeComIcon`
- [x] 4.4 收口 `DEFAULT_ASPECT_RATIO` 改值带来的语义漂移：三处把它当字面量 `'auto'` 用的地方
      （`ai-image-generation.tsx` 的 `getAspectRatioFromSizeParam` / `applyAspectRatioToParams`、
      `ai-generation-preferences-service.ts` 的 `sizeParamToAspectRatio`）改回 `AUTO_ASPECT_RATIO.value`
- [x] 4.5 修掉 4.2 引入的回归：显式的「自动」/模型表达不了的旧比例，不再被新的 size 默认值
      顶成 16:9（`getSupportedImageToolSizeFromAspectRatio` 把 auto 显式落成 size 参数里的 `auto`）
- [x] 4.6 补一条守卫「没存过偏好 → 16:9 横版」的用例，并反向验证它会随默认值回退而失败

## 5. Acceptance

- [x] 5.1 `pnpm typecheck` 通过（5/5 项目）
- [x] 5.2 改动文件 `eslint` 无新增问题（唯一 error 是 `image-aspect-ratios.ts:90`
      的 `no-inferrable-types`，`git show HEAD` 确认改动前就在）
- [x] 5.3 回归对比：改动前 `ai-generation-preferences-service.test.ts`（补 localStorage 垫片后可跑）
      只有 1 条既有失败；实现过程中曾因 4.2 多出 2 条失败，已由 4.4 / 4.5 修回归零新增；
      全量 `pnpm test` 失败用例 169 条，与仓库既有基线一致
- [x] 5.3.1 受影响单测全绿：`KeyboardDropdown.test.tsx` 7/7、`model-config.test.ts` 26/26，
      偏好服务 31/32（唯一失败是既有基线那条）
- [x] 5.4 `pnpm run build:web` 通过
- [x] 5.5 触屏上下文（`hasTouch: true` + `tap()` / CDP `Input.dispatchTouchEvent`）实测 375×667 与 360×640
      （844×390 横屏仍走桌面布局，见 Non-Goals）
- [x] 5.6 文本：选工具 → `tap` 画布空白 → 浮动输入框出现且 `document.activeElement` 为它 → 提交后画布真的出现文本元素
      （画布 click 1 次、输入框 14px 宽且已聚焦、SVG 增长 519 字符）
- [x] 5.7 箭头：开「更多工具」→ `tap` 箭头 → 3 个箭头条目可见 → `tap` 直线箭头 → 外层面板仍在、
      选中态从「选择」移走、拖拽后画布出现箭头线（SVG 增长 559 字符，含箭头三角）
- [x] 5.8 参数面板：375×667 下 rect `[12, 290]`、360×640 下 `[12, 275]`，均 `x >= 0 && right <= innerWidth`，
      越界子元素 0 个
- [x] 5.9 转换预览：两个弹窗均 `dialogWithin`、`panelsInsideDialog`、`.ttd-dialog-panels` 为 `overflow-y: auto`
      的滚动容器、`docScrollX === 0`
- [x] 5.10 企业微信图标：单条 `path`，`viewBox="0 0 24 24"`，`d` 以 `M17.3261 8.15754L17.3228 8.15069C1` 开头，
      不再是旧气泡路径 `M7.9 20A9 9…`
- [x] 5.11 16:9：空 localStorage 新上下文下参数面板选中「16:9 横版」；
      预置 `size: 1x1` 的偏好时仍选中「1:1 方形」（已存偏好优先于新默认值）
- [x] 5.12 **反向验证**（逐条回退并确认断言失败）：
      - 2.1 回退为无条件 `preventDefault()` → 画布 click **0** 次、输入框不出现、SVG 无增长
      - 2.5 去掉 `.viewport-container` 的 `touch-action: none` → 画笔触屏拖拽只收到 20 次移动里的
        **2** 次并抛 `pointercancel: 1`；矩形同样画不出来。加回后 `pointercancel: 0`、
        20–48 次移动全部送达、画笔合成**单条** path（48 段）、矩形得到
        `M-36 -82 L90 -82 L90 12 L-36 12`
      - 2.4 去掉 `focus-out` 判断 → 箭头条目 **0** 个、面板关闭、指针停在「选择」
      - 2.3 去掉嵌套 `plait-board-attached` → 条目 0 个（一闪即关），选中态不更新
      - 3.1 回退 `KeyboardDropdown` → 菜单 rect `[264, 464]` 越出 375 视口，子元素右缘到 463
      - 3.3–3.5 回退 `ttd-dialog.scss` → `.ttd-dialog-panels` 越出弹窗底 35px，
        预览容器越出弹窗底 159px 且 `overflow-y: visible`
- [x] 5.13 单指平移、双指缩放行为与改动前一致：多指分支仍是 `touches.length > 1` 才 `preventDefault()`；
      单指平移改由 2.5 的 `touch-action: none` 拦下（实测两指缩放 scale 保持 1、选择工具拖拽
      不再滚动画布 `dscrollLeft/dscrollTop` 均为 0）；
      `user-scalable=no` 与 `html/body/#root` 的 `touch-action: none` 未改
- [x] 5.14 菜单子项（375×667 触屏）：展开工具栏 → `tap` 应用菜单 → `tap` 语言 →
      子菜单出现「中文 / English」且**父菜单仍在**、子菜单 rect `[77, 383, 87, 90]` 在视口内 →
      `tap` English → 重开菜单已是 `Language`（菜单按钮 aria-label 变 `App Menu`）；
      `tap` 导出图片 → 子菜单换成「PNG / JPG」且语言子菜单随之收起（不重叠）；
      `tap` 画布空白 → 全部关闭。桌面（1280×800）同一脚本结果一致，行为无变化
- [x] 5.15 **反向验证 2.6**：改动前同一脚本（`tap` 语言）→ 子菜单条目 **0** 个、
      父菜单已关（`langItemStillThere: false`）、语言未切换

## 6. 遗留（需真机补测）

- [ ] 6.1 iPhone Safari / Android Chrome 真机复测 2.1 / 2.2 / 2.4 —— 模拟器只是初筛，
      软键盘弹出与 pointercancel 时序必须在真机上才算数
