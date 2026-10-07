## MODIFIED Requirements

### Requirement: 预置单一 provider，教师只需提供 API Key

系统 SHALL 预置一个指向 tu-zi 网关的 provider，使教师接入的最小路径为「粘贴一把 API Key」。系统 SHALL NOT 要求教师配置 base URL、供应商类型或额外的 provider 条目。教师侧提供 Key 的界面 SHALL 是引导弹窗，SHALL NOT 是设置面板。

#### Scenario: 首次配置只需填写 Key
- **WHEN** 教师首次触发配置（打开引导弹窗，或提交生成任务时被拦截）
- **THEN** SHALL 只需要填写 API Key 一项即可完成接入，base URL 与 provider 类型 SHALL 已预填
- **AND** SHALL NOT 要求教师打开设置面板

#### Scenario: 填写 Key 后可直接生图
- **WHEN** 教师粘贴有效的 tu-zi 子密钥并保存
- **THEN** 教师 SHALL 能立即在 AI 输入栏发起图片生成，SHALL NOT 需要额外步骤

## ADDED Requirements

### Requirement: 设置面板不对教师暴露入口

系统 SHALL NOT 向教师暴露通往设置面板的 UI 入口：应用菜单、命令面板、模型选择器、认证错误处理与工具箱等教师可达路径均 SHALL NOT 打开设置面板。设置面板的实现与窗口渲染 MAY 保留于代码库；管理员 SHALL 能通过一个不面向教师的隐藏手势打开它。

#### Scenario: 菜单与命令面板无入口
- **WHEN** 教师展开应用菜单，或在命令面板中搜索「设置」
- **THEN** SHALL NOT 出现「设置」菜单项或对应的命令条目

#### Scenario: 模型选择器不提供供应商管理入口
- **WHEN** 教师打开模型选择器
- **THEN** SHALL NOT 出现打开供应商配置或新增供应商的按钮

#### Scenario: 认证错误引导到引导弹窗而非设置面板
- **WHEN** 生成请求因缺少或使用了失效的 API Key 而失败
- **THEN** 系统 SHALL 显示指向工具栏企业微信图标的提示，并 SHALL 打开引导弹窗以接收新的 Key
- **AND** SHALL NOT 打开设置面板

#### Scenario: 管理员隐藏手势仍可打开设置面板
- **WHEN** 管理员在应用菜单底部的版本行上于 1.5 秒内连点 5 次
- **THEN** 设置面板 SHALL 打开
- **AND** 连点不足 5 次、或两次点击间隔超过 1.5 秒时，设置面板 SHALL NOT 打开

#### Scenario: 缺少入口时窗口仍可渲染
- **WHEN** 任一代码路径将应用的 `openSettings` 状态置为真
- **THEN** 设置面板窗口 SHALL 正常渲染并可关闭，SHALL NOT 出现只置状态而无窗口的死路
