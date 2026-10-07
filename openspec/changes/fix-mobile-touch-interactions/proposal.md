# Change: 修复移动端触控交互与面板适配

## Why

教师发行版在真机（手机/平板）上暴露出一组"桌面正常、手指失效"的缺陷，性质与上一轮 `update-mobile-experience` 的阻断项不同——这些入口**看得见、点得着，但点了没有下文**：

1. 工具栏**文本**工具：选中后点画布没有任何反应，建不出文本。
2. 工具栏**箭头**工具：在「更多工具」里选箭头时面板一闪即关，像没反应。
3. 图片模式下**设置生成参数**面板右缘跑出屏幕，部分内容被裁掉。
4. **Markdown 到 Drawnix** / **Mermaid 到 Drawnix** 的预览溢出弹窗边界。

根因集中在三处"只按鼠标路径写"的实现：

- `packages/react-board/src/hooks/use-board-event.ts` 对 `.viewport-container` **无条件**取消单指 `touchstart`。按 Touch Events 规范，取消 `touchstart` 会连带抑制兼容鼠标事件序列（含 `click`），而**文本浮动输入框恰好只挂在画布 `click` 上**（`drawnix.tsx` 的 `handleClick`）——触屏上该监听器永不触发。
- 「更多工具」的嵌套箭头选择器被 portal 到 `.plait-board-container`，不在共享 `Popover` 的 outsidePress 白名单里，于是选中箭头的那一下同时被**外层**面板判定为"外部按压"。更致命的是第二重关闭：嵌套选择器打开时会把焦点搬进自己的浮层，floating-ui 随即以 `reason === 'focus-out'` 请求关闭外层面板；桌面端 `isHovering` 为真时这条被挡下，触屏上恒为 false —— 外层在触屏分支里是强制关闭的，整棵子树随之卸载，选择器的收尾回调（真正更新指针选中态的那步）永远跑不到。白名单与 `focus-out` 两处都要修，只修白名单箭头仍不可用（见 `tasks.md` 5.12）。
- `parameters-dropdown.scss` 的 `min-width: 200px` 是硬下限且没有任何 `@media` 覆盖。上一步 `KeyboardDropdown` 只钳制了 `max-width`，而 CSS `min-width` 恒压过 `max-width`；面板又锚在**右对齐**的触发器左缘向右展开，只能变窄不能左移，于是被顶出屏幕。同一病害上一轮已在 `.model-dropdown__menu` 上修过，参数面板漏了。

同时落两处产品调整：图片尺寸默认改为「16:9 横版」，工具栏管理员联系入口改用真正的企业微信标识（现用的 `WeComIcon` 是一个通用对话气泡，不是企业微信 logo）。

## What Changes

- 画布容器只对**多指**手势取消 `touchstart`，恢复单指触摸的兼容 `click`，使画布上依赖 `click` 的交互（文本浮动输入框、抽屉收起）在触屏上重新可用。双指缩放/平移的既有防护不变。
- 文本浮动输入框在触屏上可见：给出可见的光标宽度与淡边框，并把聚焦放进手势内提交，避免 iOS 不弹软键盘。
- 「更多工具」的嵌套箭头选择器加入共享 `Popover` 的 outsidePress 白名单，并让外层面板忽略嵌套浮层引发的 `focus-out` 关闭请求，选中箭头后外层面板不再被连带关闭，指针选中态正常生效。`Popover` 的 `onOpenChange` 类型同步透出 floating-ui 的 `reason`。
- `KeyboardDropdown` 按触发器左右**可用空间更充裕的一侧**决定锚定方向，修复右对齐触发器下所有下拉（参数、模型、数量、类型）的横向溢出。
- `ttd-dialog` 的布局约束落到真实存在的 DOM 类上：为 `.Dialog.ttd-dialog` 与 `.ttd-dialog-panels` 补 `max-height`/滚动、`min-height: 0`，为面板补 `min-width: 0`，并在移动端把写死的 `height: 400px` / `height: 10rem` 改为可伸缩。删除三个指向已不存在类的死选择器。
- 所有图片模型的 `size` 参数默认值由「自动」改为「16:9 横版」，并通过 `DEFAULT_IMAGE_SIZE` 常量化，避免五处字面量重复；`DEFAULT_ASPECT_RATIO` 同步。视频/音频参数不受影响。
- 工具栏管理员联系入口由自绘的通用对话气泡图标改为 `tdesign-icons-react` 的 `LogoWecomIcon`，删除已无消费者的 `WeComIcon`。

## Impact

- Affected specs:
  - `mobile-experience`（ADDED：触屏可用的画布 `click` 依赖交互、面板与预览须落在视口内）
  - `toolbox`（ADDED：管理员联系入口的品牌标识）
  - `image-generation`（ADDED：图片尺寸默认值）
- Affected code:
  - `packages/react-board/src/hooks/use-board-event.ts`
  - `packages/drawnix/src/drawnix.tsx`
  - `packages/drawnix/src/components/toolbar/more-tools-button.tsx`
  - `packages/drawnix/src/components/ai-input-bar/KeyboardDropdown.tsx`（+ 同名测试）
  - `packages/drawnix/src/components/ttd-dialog/ttd-dialog.scss`
  - `packages/drawnix/src/constants/model-config.ts`、`constants/image-aspect-ratios.ts`
  - `packages/drawnix/src/services/ai-generation-preferences-service.ts`、`components/ttd-dialog/ai-image-generation.tsx`（`DEFAULT_ASPECT_RATIO` 改造带来的收口）
  - `packages/drawnix/src/components/popover/popover.tsx`（`onOpenChange` 透出 floating-ui 的关闭原因）
  - `packages/drawnix/src/components/feedback-button/feedback-button.tsx`、`components/icons.tsx`

## Non-Goals

- **不**把 `arrow` 挪进主工具栏默认可见（它本就属于「更多工具」的默认收起集合）。
- **不**改动 Plait 原生文本创建路径，也**不**移除现有的浮动文本输入框设计——本次只修它在触屏上不可达 / 不可见的问题。
- **不**处理横屏手机（约 844px 宽）整体仍套用桌面布局、工具栏按钮 36×36 低于触控标准的问题：那是断点体系问题，需要单独一次变更。
- **不**清理 `styles/_responsive.scss` 中零消费的混入，也**不**拆分已超 500 行的 `chat-drawer.scss`。
- **不**改变任何视频/音频生成参数。

## Implementation Notes

- `use-board-event.ts` 的 `touchstart` 只收窄到 `event.touches.length > 1`，**不删除**该监听器：多指行为因此与改动前逐字一致，而单指手势不再被取消。滚动的既有防线不受影响——`apps/web/index.html` 的 viewport meta 是 `user-scalable=no, maximum-scale=1`，`apps/web/src/styles.scss` 对 `html, body, #root` 设了 `touch-action: none`。
- 白名单用法沿用仓库既有约定：`popover.tsx` 的 `outsidePress` 已把 `.plait-board-attached` 作为"board 附属浮层不算外部"的判据，`parameters-dropdown__menu` 等 portal 浮层都带这个类。
- `focus-out` 判断只在触屏生效，桌面端行为逐字不变（桌面本来就靠 `isHovering` 挡住这条）。触屏的关闭途径仍是「点外部」或「再点一次更多」，所以没有把面板变成关不掉。
- `KeyboardDropdown` 的选边逻辑对左对齐触发器（抽屉内等）判定结果不变，因此是纯增量修复，不引入回归面。
- 图片尺寸默认值只影响**新装或未选择过该参数**的场景：`sanitizeSelectedParams` 只在已存值无效时回退到默认值，老用户不会被被动改变。
- `DEFAULT_ASPECT_RATIO` 从 `'auto'` 改为 `'16:9'` 之后，原先拿它当**字面量 `'auto'`** 用的三处必须一起收口（`AUTO_ASPECT_RATIO.value`），否则「模型自动决定」会被读成「产品默认比例」。同时 `getSupportedImageToolSizeFromAspectRatio` 要把「自动」显式落成 size 参数里的 `auto`：它原先返回 `undefined` 恰好等价，只是因为那时的默认值就是 `auto`；默认值一改成 `16x9`，下游补默认值的逻辑就会把用户显式选过的「自动」或旧比例悄悄改成 16:9。这两点由 `ai-generation-preferences-service.test.ts` 里既有的「保留为扩展比例」用例守住，回归是在实现过程中被它们抓到的。

## Status

- 提案创建：待评审
- 实现：已完成，`pnpm typecheck` / `pnpm run build:web` 通过，受影响单测 64/65 通过（唯一失败为既有基线）
- 验证：触屏上下文（375×667、360×640）逐条实测 + 反向验证已完成，记录见 `tasks.md` 的 5.5–5.13
- 待办：iPhone Safari / Android Chrome 真机补测（软键盘与 pointercancel 时序）
