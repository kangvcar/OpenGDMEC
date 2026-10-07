# Change: 移动端可用性修复与一致性收敛

## Why

仓库已有响应式底子（`styles/_responsive.scss` 断点与安全区混入、`hooks/useDeviceType.ts` 响应式设备信息、多数面板带 `@media` 分支），但若干处没有覆盖到，导致手机上**功能直接走不通**而非仅仅样式不佳：聊天抽屉没有可用入口、双指缩放被浏览器中断后画布平移与绘制永久失效、素材库窗口被强制撑到 800px 宽、模型选择菜单溢出屏幕。另有一处挂载后不再更新的移动端标志，使窄栏模式下的工具可见性错乱。

## What Changes

- 移动端恢复聊天抽屉入口：把唯一的触发条从 `display:none` 改为底部圆形按钮，抽屉保持全宽面板
- 画布指针事件补齐 `pointercancel`：浏览器中断手势（如接管捏合）时清理指针记录并复位捏合状态，画布不再需要刷新才能恢复
- 素材库窗口在移动端自动最大化，不再被 `minWidth` 撑破视口
- 模型选择菜单在移动端取消 600px 最小宽度，并由公共下拉外壳统一钳制最大宽度，保证菜单完整落在视口内
- 删除挂载后冻结的 `appState.isMobile` 与已无消费者的 `drawnix--mobile` 类、`isMobile()` SCSS 混入，唯一消费点（手型工具可见性）改用响应式的 `useIsMobile()`
- 移动端窄栏宽度由 38px 调整为 44px，使触控目标不被药丸背景裁切
- 移动端作用域内的 `100vh` 改为 `100dvh`，避免地址栏区域导致弹窗被裁
- 补齐 641–768px（横屏手机）区间的下拉与会话列表约束，并为聊天滚动容器补充触控惯性

## Impact

- Affected specs:
  - `mobile-experience`（新增能力）
- Affected code:
  - `openspec/changes/update-mobile-experience/specs/mobile-experience/spec.md`（新增）
  - `packages/drawnix/src/components/chat-drawer/chat-drawer.scss`
  - `packages/react-board/src/hooks/use-plugin-event.tsx`
  - `packages/react-board/src/plugins/with-pinch-zoom-plugin.ts`
  - `packages/drawnix/src/components/media-library/MediaLibraryModal.tsx`
  - `packages/drawnix/src/components/ai-input-bar/model-dropdown.scss`
  - `packages/drawnix/src/components/ai-input-bar/KeyboardDropdown.tsx`
  - `packages/drawnix/src/drawnix.tsx`
  - `packages/drawnix/src/hooks/use-drawnix.tsx`
  - `packages/drawnix/src/components/toolbar/creation-toolbar.tsx`
  - `packages/drawnix/src/styles/variables.module.scss`
  - `packages/drawnix/src/styles/index.scss`
  - `packages/drawnix/src/styles/_responsive.scss`
  - `packages/drawnix/src/styles/tdesign-theme.scss`

## Non-Goals

- 不改 `prevent-pinch-zoom-service.ts` 的选择器白名单：该服务先判 `isInCanvasArea`，画布外面板本就不受影响；这是 `docs/TOUCH_ZOOM_PREVENTION.md` 记录的**有意**三层防御，缩小白名单只会引入回归
- 不把 ~90 处手写媒体查询改造为共享混入：`_responsive.scss` 仅被 `styles/index.scss` 导入，各组件 `.scss` 编译入口不同，改造是大量编辑换零用户可见收益
- 不合并其余设备检测实现（UA 版 `getDeviceType`、`isMobileDevice`、各组件自定阈值）：语义或阈值本就不同，本次只删除新增的僵化分叉
- 不做 PWA 安装引导，不改 `user-scalable=no`（后者是有意取舍，无障碍代价已在文档记录）
- 不拆分 `chat-drawer.scss`（已超 500 行约定属既有问题，本次仅增约 25 行）

## Implementation Notes

- 聊天入口选择纯样式方案（复用已有 `ChatDrawerTrigger` 组件与 `--active` 修饰符），不新增工具栏按钮：后者需要改动 38px 窄栏、`ChatDrawerContext` 接线与新图标
- `pointercancel` 必须走 `board.pointerCancel`，不得接入 `globalPointerUp`：后者会重跑 `with-moving`/`with-hand` 的收尾逻辑，可能提交浏览器刚刚中止的拖拽
- 素材库采用 `autoMaximize`（与 `ttd-dialog.tsx` 同款先例）而非 `SettingsDialog` 的 `minWidth` 数学，改动更小
- 下拉宽度收口在公共外壳 `KeyboardDropdown`，用 CSS `max-width` 压住调用方内联宽度，避免逐个改调用方

## Status

提案待用户确认，运行代码尚未修改。
