## ADDED Requirements

### Requirement: 发行档位只暴露生图、白板与素材库入口

系统 SHALL 在面向教师的发行档位中，仅暴露图片生成、白板画布与素材库三类功能入口。视频与音频生成的 UI 曝光面 SHALL 从所有出口移除，包括工具栏按钮配置、AI 输入栏类型切换、模型选择器、素材库类型筛选、MCP/Agent 工具注册与 workflow 导航。底层实现代码 SHALL 保留。

#### Scenario: 工具栏不出现视频按钮
- **WHEN** 教师打开任意画板
- **THEN** 工具栏 SHALL NOT 渲染 AI 视频相关按钮，且存量配置迁移后也不会恢复该按钮

#### Scenario: AI 输入栏类型切换只含图片
- **WHEN** 教师打开 AI 输入栏的类型切换
- **THEN** 可选生成类型 SHALL 只包含图片，SHALL NOT 出现视频或音频选项

#### Scenario: 模型选择器不列出非图片模型
- **WHEN** 教师展开模型选择器
- **THEN** 列表 SHALL 只展示图片类型模型，SHALL NOT 展示视频或音频类型模型

#### Scenario: Agent 工具集不注册视频工具
- **WHEN** 教师以 Agent 模式发起请求
- **THEN** 可用工具集 SHALL NOT 包含视频生成、长视频生成、视频讲解或视频分析工具

#### Scenario: 生成入口的底层实现保持可用
- **WHEN** 开发者查阅代码或运行既有单元测试
- **THEN** `/v1/videos` 提交逻辑、任务类型枚举、统一缓存服务与 Service Worker 视频 URL 识别 SHALL 仍然存在，以保证异步图片生成不受影响

### Requirement: 发行版使用 OpenGDMEC 作为品牌标识

系统 SHALL 在面向教师的发行档位中，以 `OpenGDMEC` 作为对外品牌标识，覆盖页面标题、描述、站点元数据、manifest 与首页文案。仅品牌展示位 SHALL 被替换；内部标识符 SHALL 保持不变。

#### Scenario: 页面元数据展示新品牌
- **WHEN** 教师打开站点或将其安装为 PWA
- **THEN** 页面标题、描述与 manifest 中的应用名称 SHALL 显示为 OpenGDMEC

#### Scenario: 内部标识符不被改动
- **WHEN** 构建产物运行并访问本地存储与 Service Worker
- **THEN** IndexedDB 库名（`aitu-app`、`sw-task-queue`）、Service Worker 虚拟缓存路径（`__aitu_cache__`）、包名（`@aitu/*`）与代理路由名（`__opentu_tuzi_proxy__`、`__opentu_tuzi_session__`）SHALL 保持原值，既有用户数据 SHALL 不丢失

### Requirement: 发行版不注入第三方统计 tracker

发行档位 SHALL NOT 在页面中注入第三方统计脚本。业务埋点代码 SHALL 保留，并在 tracker 不存在时静默降级为无操作。本要求 SHALL 通过发行档位实现，SHALL NOT 修改 `analytics-reporting` 能力的既有要求。

#### Scenario: 页面不加载统计脚本
- **WHEN** 教师打开站点并观察网络请求
- **THEN** SHALL NOT 出现到统计服务端点的请求

#### Scenario: 无 tracker 时埋点静默降级
- **WHEN** 业务代码触发埋点调用而 tracker 未加载
- **THEN** 调用 SHALL 直接返回且不抛出异常，SHALL NOT 影响生成流程
