# Change: 定制面向高校教师的 OpenGDMEC 发行版

## Why

Opentu 现有形态是面向公网的完整产品：功能面覆盖图片/视频/音频/工作流/Agent，默认引导用户登录 tu-zi 账户体系，并向 `umami.tu-zi.com` 上报统计。广东机电职业技术学院需要把它收敛成一个内部教师工具：**只暴露「生图 + 白板 + 素材库」**，密钥由管理员在 tu-zi 后台创建后手动发放，且必须能部署到免服务器的静态托管，并最终在国内校园网稳定可达。

## What Changes

- **功能可见性收敛**：视频、音频生成的 UI 入口从所有出口移除（工具栏、AI 输入栏类型切换、模型选择器、素材库筛选、MCP/Agent 工具集、Agent Skill 目录、workflow 导航）。**底层代码保留**——异步图片模型复用 `/v1/videos` 接口，删除会打断生图（详见 design.md）。
- **MODIFIED** `ai-input-generation` 的 `Agent Skill Media Model Selectors`：该 requirement 现有场景断言"选中视频/音频 Skill 时须显示对应模型选择器"，与本发行档位直接冲突，按新行为重写。
- **新增教师接入路径**：预置单一 tu-zi provider，教师只需粘贴一把 API Key 即可生图；隐藏 tu-zi 账户/令牌面板与「获取模型」入口。
- **品牌标识**：`Opentu` → `OpenGDMEC`（仅品牌展示位，不动内部标识符）。
- **关闭第三方统计上报**：不加载 Umami tracker。**不改动 `analytics-reporting` 能力本身**（代码与事件保留，无 tracker 时自动 no-op），因此与 pending change `replace-posthog-with-umami-analytics` 不冲突，两者可独立归档。
- **新增静态托管部署配置**：适配 Cloudflare Pages，移除对 Netlify/Vercel 外部代理的依赖；预留 ICP 备案后切换国内对象存储的路径。

## Non-Goals

- **不删除**视频/音频/工作流/PPT/MCP 的底层代码，只收敛 UI 曝光面。
- **不收敛**工作流、PPT 讲解、MCP/Agent、文本生成——这些留待部署后实测再决定，另开 change。
- **不建立**访问控制、账号系统或领取页：无 Key 即无法生图，作为唯一的准入门槛。
- **不自建**任何转发/限额/计数服务：限额由 tu-zi 子密钥在服务端执行。
- **不引入**自定义域名或 ICP 备案的自动化——备案是线下流程，本 change 只保证切换成本可控。
- **不重命名**内部标识符（见 design.md 的危险清单）。

## Impact

- Affected specs：
  - `distribution-profile`（新增能力）
  - `teacher-onboarding`（新增能力）
  - `static-hosting-deployment`（新增能力）
  - `ai-input-generation`（MODIFIED：`Agent Skill Media Model Selectors`）
- Affected code：
  - 功能可见性：`packages/drawnix/src/types/toolbar-config.types.ts`、`components/ai-input-bar/*`、`mcp/index.ts`、`components/media-library/MediaLibrarySidebar.tsx`、`workflow-mode/web/src/constant/navigation-tools.ts`
  - 教师接入：`packages/drawnix/src/utils/settings-manager.ts`、`components/settings-dialog/*`
  - 品牌与统计：`apps/web/index.html`、`apps/web/public/manifest.json`、`apps/web/public/home.html`、`apps/web/public/en/home.html`、`package.json`
  - 部署：`apps/web/public/_redirects`、`apps/web/public/_headers`、`netlify.toml`、`vercel.json`
- Affected tests：`packages/drawnix/src/utils/umami-analytics.test.ts`（锁定 3 个 HTML 入口）、`apps/web-e2e/*`、视觉回归基线
- Related pending change：`replace-posthog-with-umami-analytics`（未归档，已按不冲突方式设计）
