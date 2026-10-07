## ADDED Requirements

### Requirement: 管理员联系入口使用企业微信品牌标识

工具栏上的管理员联系入口 SHALL 使用企业微信（WeCom）的品牌标识作为图标，MUST NOT 使用通用对话气泡等非品牌图形代指。该入口的标签与提示文案（`ADMIN_CONTACT_TEXT`）以及点击后打开的引导弹窗保持不变。

#### Scenario: 教师看到工具栏上的管理员联系入口

- **GIVEN** 教师发行版的画布已加载
- **WHEN** 工具栏渲染管理员联系入口
- **THEN** 该入口的图标 SHALL 为企业微信品牌标识
- **AND** 图标 SHALL 为矢量图形并随工具栏图标尺寸与主题色渲染
- **AND** 图标 SHALL NOT 携带硬编码的品牌色而脱离工具栏配色

#### Scenario: 点击入口打开既有引导弹窗

- **GIVEN** 工具栏上的管理员联系入口可见
- **WHEN** 用户激活该入口
- **THEN** SHALL 打开「如何获取 API Key」引导弹窗
- **AND** 弹窗内的二维码与 Key 输入框 SHALL 保持既有行为
