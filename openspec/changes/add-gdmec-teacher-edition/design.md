## Context

仓库为 pnpm + Nx monorepo，前端 `packages/drawnix` + `apps/web`，构建产物是纯静态 SPA（`dist/apps/web`），带一个同源 Service Worker。无 SSR、无 Node 服务端、无 serverless functions。

使用场景：广东机电职业技术学院 100+ 教师，国内校园网，不额外购买服务器。密钥由管理员在 tu-zi 后台创建子密钥后手动发放给教师，教师在设置里粘贴。不设账号系统、不做访问控制。

关键约束来自 2026-10-05 的实测：

- `api.tu-zi.com` **支持 CORS**（预检 200、回显任意 Origin、放行 `Authorization`）→ 生图链路浏览器直连即可，**纯静态托管不需要任何后端代理**。
- Cloudflare Pages 的 `_redirects` **不支持外部代理**（官方文档：`Proxying will only support relative URLs on your site. You cannot proxy external domains.`）。
- `pages.dev` 在大陆不稳定，Cloudflare 官方 China Network FAQ 明确 Pages 不进入大陆。

## Goals / Non-Goals

- Goals：
  - 教师打开站点即可用一把 Key 生图，路径不超过「粘贴 Key → 输入提示词 → 出图」。
  - 功能面收敛到生图 + 白板 + 素材库，其余入口不出现。
  - 构建产物可直接部署到 Cloudflare Pages，且日后切换国内对象存储不需要改业务代码。
- Non-Goals：
  - 不追求 pages.dev 在国内的可用性（已知不可靠，靠后续备案域名解决）。
  - 不删除底层能力代码。
  - 不做密钥的安全分发机制（密钥本就是明文交付给使用者的凭证）。

## Decisions

### Decision 1：只收敛 UI 曝光面，不删除视频/音频底层代码

`media-api/video-api.ts` 的 `submitVideoGeneration` 被**异步图片生成**复用——`fallback-executor.ts:648-672` 的 `generateAsyncImageTask` 走的就是 `/v1/videos` 接口。`task-queue-service.ts` 单文件 `switch(task.type)` 同时服务 image/video/audio/chat，`UnifiedCacheService`、`TaskType` 枚举、`sw/index.ts` 的视频 URL 识别也都是共享基础设施。

- 全量删除视频预估触及 150–250 个生产文件，且必须精确避开上述共享点，回归风险高。
- 收敛入口只需改 6 个文件，生图链路零改动。
- Alternatives considered：加一个 `enableVideo` feature flag 统一控制——被否，项目没有既有 feature flag 机制，为一个发行版引入开关层是过度设计；且 flag 需要在十几处散落的 `type === 'video'` 判断中生效，改动面反而更大。

### Decision 2：教师接入用「预置 provider + 隐藏账户体系」，绕开同源代理

现有两条同源代理只服务 tu-zi 账户体系（登录、建令牌、`runtime-model-discovery.ts` 的模型发现）。既然密钥是手动发放、教师不需要登录账户，把账户/令牌面板与「获取模型」入口隐藏，代理需求**整条消失**——正好规避 Cloudflare Pages 不支持外部代理的限制。

模型列表改用仓库内置的静态表 `constants/model-config.ts`，教师无需联网发现模型。

- Alternatives considered：用 Cloudflare Worker/Functions 复刻两条代理——被否。为一个被隐藏的功能引入 Worker，既增加部署复杂度，也与「免服务器」约束相悖。

### Decision 3：统计上报按「发行档位不注入 tracker」处理，而非修改 analytics 能力

`umami-analytics.ts:255` 在 `window.umami` 不存在时直接 return。因此只要 3 个 HTML 入口不注入 script，全部业务埋点自动 no-op，**不需要改动 `analytics-reporting` 能力的任何 requirement**。

这样 pending change `replace-posthog-with-umami-analytics` 可以独立归档，两个 change 不产生 spec 冲突。

### Decision 4：品牌改名只碰品牌展示位

`Opentu` 仅出现在 42 个文件中，且 `packages/drawnix/src/i18n.tsx` 里 **0 处**——界面正文不含品牌词。改名集中在外围元数据。

**危险清单（禁止替换）**：

| 标识符 | 位置 | 替换后果 |
|---|---|---|
| `__opentu_tuzi_proxy__` / `__opentu_tuzi_session__` | SW、前端、`_redirects` | 路由失效 |
| `aitu-app`（IndexedDB 名） | `apps/web/src/services/app-database.ts` | 教师画布与配置全丢 |
| `sw-task-queue`（IndexedDB 名） | `apps/web/src/sw/task-queue/storage.ts` | 任务队列失效 |
| `__aitu_cache__`（SW 虚拟路径） | SW fetch 拦截 | 图片缓存全失效 |
| `@aitu/utils` 等 | 4 处 `package.json` | 构建失败 |
| `opentu.ai` / `github.com/ljquan/opentu` | `index.html`、`package.json` | 外链与元数据失效 |
| **Gist 描述前缀 `Opentu - 数据同步` / `Opentu - Media Shard` / `Opentu Sync {date}`** | `services/github-sync/{types,shard-types,token-service}.ts` | **存量 gist 全部失联** |

**Gist 描述前缀是数据契约，不是品牌位**：`apps/web/public/sw-debug/gist-management.js:1950` 用
`g.description?.includes('Opentu')` 来识别「哪些 gist 是本应用的」。改前缀或改匹配串，任一侧漏改都会让
已有用户的云端同步数据找不到（与 IndexedDB 库名同一类风险）。因此这 5 个文件（含
`components/sync-settings/TokenGuide.tsx` 中与之对应的说明文案）**保持原样**。

规则：只替换作为**品牌展示**出现的大写 `Opentu`，且跳过上表中的数据契约。

### Decision 5：托管先 Cloudflare、备案并行

pages.dev 国内不可达是已知且被接受的前期代价，用于功能验证。部署配置写成与托管商无关的形态（`_headers` + `_redirects` 的同源部分），保证日后切国内对象存储时不需要改业务代码。两条外部代理规则**删除而非迁移**（见 Decision 2）。

## Risks / Trade-offs

- **pages.dev 在国内不可用** → 教师可能打不开。缓解：明确这是验证阶段，备案域名就绪后切换；不在 pages.dev 阶段做教师推广。
- **Service Worker 在切换托管商后可能命中旧缓存** → SW 用相对路径注册（`bootstrap.tsx:393` 的 `register('./sw.js')`）、`base: './'`，切换域名即换 origin，缓存天然隔离。风险低。
- **隐藏入口后仍有代码可达**（如 Agent/MCP 工具集）→ 若 `mcp/index.ts` 漏改，Agent 模式仍能触发视频生成。缓解：tasks 中列为必改项，并在验证步骤用 grep 断言 UI 层无 `ai-video` 可达路径。
- **E2E 与视觉回归基线会失败** → `apps/web-e2e` 与 Playwright 视觉基线包含视频相关用例与截图。缓解：tasks 中显式包含基线更新步骤，不能靠「测试挂了再说」。
- **密钥明文落 IndexedDB**（`config-indexeddb-writer.ts:82-101` 未加密，localStorage 层才加密）→ 每台机器上是教师自己的 Key，风险可接受。**红线**：分发时禁止使用 `?apiKey=` / `?settings=` 预置链接（`settings-manager.ts:1476-1524`），链接一旦转发即泄密；一律要求手动粘贴。

## Migration Plan

1. 在 `develop` 分支完成本 change，`pnpm check` + `pnpm test` + `pnpm run build:web` 通过。
2. 部署到 Cloudflare Pages（pages.dev）做功能验证，管理员用测试子密钥跑通生图全流程。
3. 并行提交 ICP 备案（域名 + 国内对象存储 OSS/COS 准备）。
4. 备案通过后用同一份 `dist/apps/web` 产物切到国内托管，验证可达性。
5. 回滚：产物是纯静态，任何一步都可通过重新指向上一份构建产物回滚。

## Open Questions

- 部署后实测再决定工作流 / PPT / MCP-Agent / 文本生成是否收掉——按约定另开 change，不在本 change 内。
- 是否需要在首页加一段面向教师的「如何粘贴 Key」引导文案——待验证阶段观察教师实际卡点后再定。
