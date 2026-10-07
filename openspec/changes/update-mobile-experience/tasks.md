# Tasks: 移动端可用性修复与一致性收敛

## 1. Approval

- [x] 1.1 确认提案范围与 Non-Goals
- [x] 1.2 确认手型工具判定由 `detectMobileViewport()` 改为 `useIsMobile()` 的语义变化（窄栏模式 ≤1024px 隐藏，含平板）

## 2. P0 阻断修复

- [x] 2.1 移动端聊天入口：把被 `display:none` 隐藏的触发条改为 44×56 的侧边标签（`chat-drawer.scss`）
  - 未采用计划中的「底部圆形 FAB」：实测 375×667 与 700×900 下 FAB 与 AI 输入栏分别重叠 8px / 22px，
    且输入栏会随内容预览变高；侧边标签竖直居中，与任何浮层都不冲突
- [x] 2.2 画布绑定 `pointercancel` 事件（`use-plugin-event.tsx`）
- [x] 2.3 `withPinchZoom` 实现 `pointerCancel` 清理并复位 `isPinching`（`with-pinch-zoom-plugin.ts`）
- [x] 2.4 删除 `withPinchZoom` 中只赋值未读取的 `initializeZoom`
- [x] 2.5 素材库窗口移动端自动最大化（`MediaLibraryModal.tsx`）
- [x] 2.6 模型菜单取消移动端 600px 最小宽度（`model-dropdown.scss`）
- [x] 2.7 下拉外壳统一钳制最大宽度（`KeyboardDropdown.tsx`）
- [x] 2.8 删除 `detectMobileViewport`、`appState.isMobile`、`drawnix--mobile` 类与 `isMobile()` 混入
- [x] 2.9 手型工具可见性改用 `useIsMobile()`（`creation-toolbar.tsx`）

## 3. 一致性收敛

- [x] 3.1 移动端窄栏宽度 38px → 52px（44px 触控目标 + 两侧 4px padding），并补回被
      `.app-toolbar--embedded` / `.draw-toolbar--embedded` 的 40px 压掉的 `min-width: 44px`（`index.scss`）
- [x] 3.2 移动端作用域内 `100vh` → `100dvh`（`_responsive.scss` / `index.scss` / `tdesign-theme.scss`）
- [x] 3.3 补齐 641–768px 区间的下拉与会话列表约束（`chat-drawer.scss`）
- [x] 3.4 聊天滚动容器补充触控惯性（`chat-drawer.scss`）
- [x] 3.5 触屏设备（含横屏手机）把 18px 宽的入口标签放大到 44px —— 横屏手机宽度超过 768 断点，
      拿不到移动端覆盖，原先仍是 18px

## 4. Acceptance

- [x] 4.1 `pnpm typecheck` 通过（5 个项目）
- [x] 4.2 `pnpm test` 与改动前对比：失败文件集合完全相同（19 个），未引入回归
      （失败源于测试环境缺少 `localStorage` / `indexedDB`，属既有问题）
- [x] 4.3 `pnpm run build:web` 通过，改动均出现在产物 CSS/JS 中
- [x] 4.4 `grep -rn "drawnix--mobile\|isMobile()" packages/drawnix/src` 无代码命中
- [x] 4.5 375×667 实测：入口 44×56 且与 AI 输入栏/缩放控件均不重叠；点击可打开全宽抽屉（375/375）
- [x] 4.6 700×900 实测：同上（抽屉 700/700）
- [x] 4.7 844×390 横屏实测：入口 44×48，抽屉以 422px 侧栏打开
- [x] 4.8 工具栏窄栏实测：52px 栏内 13 个按钮全部 44×44，0 个戳出
- [x] 4.9 素材库实测：窗口 375×667，等于视口尺寸（修复前为 800px 宽、x=-212）
- [x] 4.10 双指缩放实测：合成指针事件，两指按下后 `pointercancel` 收尾，
      再次捏合 zoom 1.4 → 1.96 生效；**去掉修复后同一步 1.4 → 1.4 完全失效**（已反向验证）

## 5. 未验证 / 遗留（需在真实设备或配置好模型的环境补测）

- [ ] 5.1 模型菜单与下拉钳制的**运行时**验证：本地环境未配置 API Key，页面上不存在任何
      `model` 相关节点（模型选择器未渲染），因此只做了编译产物核对
      （`.model-dropdown__menu{min-width:0}` 与 `maxWidth` 钳制均已进入产物）
- [ ] 5.2 横屏手机（844px 宽）整体仍是桌面布局，工具栏按钮为 36×36，低于 44px 触控标准。
      这是断点体系问题（`≤768` 不覆盖横屏手机），需要单独一次变更，不在本次范围
- [ ] 5.3 `styles/_responsive.scss` 中约 10 个混入（`mobile-fullscreen`、`mobile-fixed-bottom`、
      `hide-on-mobile`、`show-on-mobile-only`、`extend-touch-area`、`desktop-large`、
      `tablet-landscape`、`safe-area-left/right`、`pointer-device`）经全仓检索确认**零消费**。
      本次只顺带修正了 `mobile-fullscreen` 里的 `100dvh`，未做整体清理，建议另案删除
