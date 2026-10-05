## ADDED Requirements

### Requirement: 预置单一 provider，教师只需提供 API Key

系统 SHALL 预置一个指向 tu-zi 网关的 provider，使教师接入的最小路径为「粘贴一把 API Key」。系统 SHALL NOT 要求教师配置 base URL、供应商类型或额外的 provider 条目。

#### Scenario: 首次配置只需填写 Key
- **WHEN** 教师首次打开设置面板
- **THEN** SHALL 只需要填写 API Key 一项即可完成接入，base URL 与 provider 类型 SHALL 已预填

#### Scenario: 填写 Key 后可直接生图
- **WHEN** 教师粘贴有效的 tu-zi 子密钥并保存
- **THEN** 教师 SHALL 能立即在 AI 输入栏发起图片生成，SHALL NOT 需要额外步骤

### Requirement: 不向教师暴露 tu-zi 账户与令牌管理入口

系统 SHALL NOT 向教师暴露 tu-zi 账户登录、令牌列表或令牌创建界面。相关组件 MAY 保留于代码库，但 SHALL NOT 在教师可达的 UI 路径中出现。

#### Scenario: 设置面板不含账户体系
- **WHEN** 教师浏览设置面板的全部区域
- **THEN** SHALL NOT 出现账户登录、令牌导入或令牌创建入口

### Requirement: 模型列表使用内置静态表，不依赖运行时模型发现

系统 SHALL 使用内置的静态模型目录向教师提供可选模型。教师侧流程 SHALL NOT 依赖向 tu-zi 网关请求模型列表，从而 SHALL NOT 依赖同源代理。

#### Scenario: 未获取模型时仍可选择内置模型
- **WHEN** 教师打开模型选择器且未触发任何模型发现请求
- **THEN** 内置的图片模型 SHALL 正常列出并可选

#### Scenario: 教师路径无同源代理依赖
- **WHEN** 教师完成「粘贴 Key → 生图」全流程
- **THEN** 全流程 SHALL NOT 请求同源代理路径（`/__opentu_tuzi_proxy__/*`、`/__opentu_tuzi_session__/*`）

### Requirement: 密钥以手动粘贴方式交付

项目文档与分发包 SHALL 引导管理员通过文本方式发放密钥并由教师手动粘贴。系统 SHALL NOT 被宣传或使用 URL 查询参数预置密钥作为分发手段。

#### Scenario: 分发说明不推荐链接预置
- **WHEN** 管理员查阅发放说明
- **THEN** 说明 SHALL 要求教师手动粘贴密钥，SHALL NOT 提供携带密钥的预置链接

#### Scenario: URL 预置入口不被使用
- **WHEN** 教师通过发放说明接入
- **THEN** 密钥 SHALL NOT 出现在浏览器地址栏或可被转发的 URL 中
