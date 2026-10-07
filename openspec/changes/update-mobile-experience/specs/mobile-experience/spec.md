## ADDED Requirements

### Requirement: Touch Devices SHALL Expose The Chat Drawer Entry Point

系统 SHALL 在触控设备上提供可见、可点击的聊天抽屉入口。抽屉在窄视口下以全宽面板呈现，且 MUST NOT 存在"入口被隐藏但无替代打开方式"的状态。

#### Scenario: Open the chat drawer on a phone

- **GIVEN** the viewport width is at most 768px
- **WHEN** the user views the canvas
- **THEN** a chat drawer entry point SHALL be visible and hit-testable
- **AND** activating it SHALL open the drawer as a full-width panel

#### Scenario: Close the drawer on a phone

- **GIVEN** the chat drawer is open at a viewport width of at most 768px
- **WHEN** the user closes the drawer
- **THEN** the drawer SHALL hide
- **AND** the entry point SHALL become visible again
- **AND** the entry point SHALL NOT overlap the drawer's own close control while the drawer is open

#### Scenario: Entry point does not collide with the AI input bar

- **GIVEN** the viewport width is at most 768px
- **AND** the AI input bar is visible
- **WHEN** the chat drawer entry point is rendered
- **THEN** it SHALL NOT overlap the AI input bar's send control

### Requirement: Canvas Gestures SHALL Recover From Pointer Cancellation

系统 SHALL 在浏览器中断指针（`pointercancel`）时释放在该指针上累积的手势状态，使画布平移与绘制无需刷新即可继续工作。双指缩放实现 MUST NOT 因取消的指针而保持"仍有两只手指按下"的状态。

#### Scenario: Browser cancels one pointer of a pinch

- **GIVEN** two pointers are down and a pinch gesture is in progress
- **WHEN** the browser dispatches `pointercancel` for one pointer
- **THEN** the system SHALL discard that pointer's tracked record
- **AND** SHALL reset the in-progress pinch state
- **AND** a subsequent single-pointer move SHALL pan the canvas

#### Scenario: Cancel does not commit an aborted drag

- **GIVEN** a drag gesture is in progress
- **WHEN** the browser dispatches `pointercancel`
- **THEN** the system SHALL NOT route the cancellation through the normal pointer-up finalization path

#### Scenario: Stale pinch state does not misclassify the next gesture

- **GIVEN** a pinch gesture has completed
- **WHEN** the user starts a new two-pointer gesture
- **THEN** gesture classification SHALL NOT inherit pinch state from the completed gesture

### Requirement: Mobile Panels SHALL Stay Within The Viewport

系统 SHALL 保证移动端浮层窗口与下拉菜单完整落在视口内，MUST NOT 因固定的最小尺寸而超出屏幕。

#### Scenario: Open the media library on a phone

- **GIVEN** the viewport width is 375px
- **WHEN** the user opens the media library
- **THEN** the window SHALL fit within the viewport
- **AND** SHALL NOT be laid out at a fixed width exceeding the viewport

#### Scenario: Open the model picker on a phone

- **GIVEN** the viewport width is at most 640px
- **WHEN** the user opens the model picker
- **THEN** the menu SHALL NOT impose a minimum width larger than the viewport
- **AND** its left edge SHALL be at or after the viewport's left edge
- **AND** its right edge SHALL be at or before the viewport's right edge

#### Scenario: Model picker with multiple provider groups

- **GIVEN** the model picker renders more than one provider group
- **WHEN** its menu is positioned
- **THEN** its rendered width SHALL be capped by the available viewport space to the trigger's right

#### Scenario: Landscape phone band

- **GIVEN** the viewport width is between 641px and 768px
- **WHEN** the chat drawer's model selector dropdown or session list is shown
- **THEN** both SHALL fit within the viewport height and width

### Requirement: Mobile Device Classification SHALL Follow Viewport Changes

系统 SHALL 使移动端判定随视口尺寸与屏幕方向变化更新，MUST NOT 在挂载时固定一次后保持陈旧值。

#### Scenario: Rotate the device

- **GIVEN** the app is running on a device whose viewport crosses a layout breakpoint when rotated
- **WHEN** the user rotates the device
- **THEN** components branching on mobile classification SHALL re-evaluate
- **AND** SHALL NOT keep the value computed at mount

#### Scenario: Tool visibility matches the toolbar's mobile layout mode

- **GIVEN** the left toolbar is rendered in its compact rail mode
- **WHEN** the creation toolbar decides whether to offer the hand tool
- **THEN** it SHALL use the same mobile classification as the toolbar's compact rail mode

### Requirement: Mobile Touch Targets SHALL Fit Their Containers

系统 SHALL 让移动端触控目标不小于 44px 且不被其容器裁切。

#### Scenario: Compact toolbar rail on a phone

- **GIVEN** the viewport width is at most 768px
- **WHEN** the compact toolbar rail is expanded
- **THEN** each control SHALL present at least a 44px hit area
- **AND** SHALL NOT visually protrude beyond the rail's background

### Requirement: Mobile Dialogs SHALL Use Dynamic Viewport Height

系统 SHALL 在移动端使用动态视口单位，使全高浮层不受浏览器地址栏区域影响。

#### Scenario: Full-height panel on a mobile browser

- **GIVEN** a mobile browser whose visible viewport is smaller than the layout viewport
- **WHEN** a full-height panel or dialog is shown
- **THEN** it SHALL size against the dynamic viewport height
- **AND** SHALL NOT be clipped or cause page overflow
