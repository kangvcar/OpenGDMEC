## ADDED Requirements

### Requirement: Canvas Touch SHALL Preserve Compatibility Click Events

画布视口容器 MUST NOT 取消单指 `touchstart`。取消该事件会连带抑制兼容鼠标事件序列（含 `click`），使画布上依赖 `click` 的交互在触屏上静默失效。多指手势（双指缩放/平移）仍 SHALL 被拦截。

#### Scenario: Single-finger tap on the canvas produces a click

- **GIVEN** the user is on a touch device and the text tool is the active pointer
- **WHEN** the user taps an empty area of the canvas
- **THEN** the tap SHALL produce a compatibility `click` on the canvas
- **AND** the inline text input SHALL appear and receive focus

#### Scenario: Two-finger gesture is still suppressed

- **GIVEN** the user is on a touch device
- **WHEN** two fingers touch the canvas
- **THEN** the `touchstart` default action SHALL be prevented
- **AND** browser-level pinch zoom SHALL NOT be applied to the page

### Requirement: Nested Tool Pickers SHALL Survive Their Parent Popover

工具面板内的嵌套选择器（如「更多工具」中的箭头选择器）SHALL 在其内容被交互时不连带关闭外层浮层。外层面板 MUST NOT 因嵌套浮层抢走焦点（dismiss reason `focus-out`）或因其内容被 portal 到浮层之外（outside-press）而关闭，选择器条目的收尾回调 MUST 能够执行完毕。

#### Scenario: Nested picker taking focus does not dismiss the parent panel

- **GIVEN** the more-tools panel is open on a touch device
- **WHEN** a nested picker inside it opens and moves focus into its own layer
- **THEN** the outer more-tools panel SHALL remain open

#### Scenario: Picking an arrow from the more-tools panel

- **GIVEN** the more-tools panel is open inside the toolbar on a touch device
- **WHEN** the user opens the arrow picker and taps a concrete arrow type
- **THEN** the arrow picker's items SHALL be visible until the user picks one
- **AND** the tapped arrow type SHALL become the active pointer
- **AND** the toolbar SHALL reflect that arrow type as selected
- **AND** dragging on the canvas SHALL create an arrow line element

### Requirement: Mobile Panels and Previews SHALL Stay Within the Viewport

移动端上由触发器锚定的浮层面板，以及对话框内的预览区域，SHALL 完整落在视口/容器边界内。面板 MUST NOT 因固定最小宽度而在横向溢出，MUST 在纵向溢出时提供滚动而不是把内容顶出边界。

#### Scenario: Right-aligned trigger opens a dropdown on a narrow viewport

- **GIVEN** the viewport width is 375px
- **AND** a dropdown trigger is right-aligned within its row
- **WHEN** the dropdown opens
- **THEN** the menu's left edge SHALL be at or after the viewport's left edge
- **AND** the menu's right edge SHALL be at or before the viewport's right edge
- **AND** the menu's content SHALL be reachable without horizontal scrolling

#### Scenario: Converter preview does not overflow its dialog

- **GIVEN** the Markdown-to-Drawnix or Mermaid-to-Drawnix dialog is open
- **WHEN** the dialog is rendered at a viewport width of 375px
- **THEN** the dialog's panel region SHALL be a scroll container (`overflow-y: auto`) that ends within the dialog's bounds
- **AND** the preview area SHALL NOT be visible outside the dialog's bounds
- **AND** the document SHALL NOT gain a horizontal scrollbar

### Requirement: Inline Text Input SHALL Be Visibly Focusable On Touch

画布上的浮动文本输入框 SHALL 提供可见的输入位置反馈，并 SHALL 在触发手势的同一事件任务内取得焦点，以在移动浏览器上唤起软键盘。

#### Scenario: Tapping the canvas with the text tool gives visible feedback

- **GIVEN** the text tool is the active pointer
- **WHEN** the user taps an empty area of the canvas on a touch device
- **THEN** the inline input SHALL be visible at the tap position with a caret-sized footprint
- **AND** it SHALL be the document's active element
- **AND** typed text SHALL be committed to the canvas as a text element
