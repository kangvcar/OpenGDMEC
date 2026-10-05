## 1. 功能可见性收敛（视频 + 音频）

- [x] 1.1 `packages/drawnix/src/types/toolbar-config.types.ts` — 从 `DEFAULT_VISIBLE_BUTTONS` 与 `ALL_BUTTON_IDS` 移除 `ai-video`
- [x] 1.2 存量配置迁移不下发 `ai-video`：`toolbar-config-service.ts` 的 legacy 布局重置 + `ALL_BUTTON_IDS` 过滤已覆盖，由新增 `services/__tests__/toolbar-config-service.test.ts` 锁定
- [x] 1.3 `GenerationTypeDropdown.tsx` — `TYPE_OPTIONS` 改为 `ALL_TYPE_OPTIONS.filter(isExposedGenerationType)`，类型切换只剩图片/文本/Agent
- [x] 1.4 模型选择器无视频/音频泄漏（**结论：无需逐处过滤**）。`generationType` 在 `loadAIInputPreferences` 被收敛，下拉也只出暴露类型，因此 video/audio 永远不会进入选择器；`ModelDropdown.tsx:493` 仅是类型名标签字典，`ai-input-bar/ModelSelector.tsx` 为存量死代码（仅 barrel 再导出、无消费者），均未改动
- [x] 1.5 `packages/drawnix/src/mcp/index.ts` — 移除视频类工具注册；另移除 `built-in-manifests.tsx` 中 `video-analyzer`、`mv-creator` 两个内置工具
- [x] 1.6 `MediaLibrarySidebar.tsx` — 移除视频筛选
- [x] 1.7 `navigation-tools.ts` + `router.tsx` — 隐藏 `/video` 页与路由
- [x] 1.8 Agent Skill 目录：`skill-media-type.ts` 的 `inferSkillMediaTypes` 统一经 `filterExposedMediaTypes` 收敛，视频/音频 Skill 不再产出媒体类型
- [x] 1.9 收尾扫查：`popup-toolbar.tsx`（`hasAIVideo`）、`InternalToolComponents.tsx`、`unified-toolbar.tsx`（含移动端折叠态按钮）、`creation-toolbar.tsx`、`more-tools-button.tsx` 均已清理；`ttd-dialog.tsx` 无需改动
- [x] 1.10 确认底层视频代码保留：`services/media-api/video-api.ts`、`services/media-executor/fallback-executor.ts` 的 `/v1/videos`、`TaskType`、SW 视频 URL 识别均未删除
- [x] 1.11 关键泄漏修复：`ai-generation-preferences-service.ts` 持久化的 `generationType` 必须收敛，否则仅移除下拉项仍可恢复 `'video'` 走隐藏路径生成视频

## 2. 教师接入路径

- [x] 2.1 模型发现解除同源代理依赖：`runtime-model-discovery.ts` 改为直连 `api.tu-zi.com`（该域名返回 CORS 头，已 curl 验证），配套修正 `runtime-model-discovery.test.ts`
- [x] 2.2 Tuzi 账户面板 — **无需改动**：`tuziMode` 仅在 Tuzi iframe 嵌入模式下为真，独立部署时账户面板本就不可达
- [x] 2.3 「获取模型」按钮 — **保留而非隐藏**：根因是同源代理依赖，已在 2.1 解除，按钮恢复正常可用
- [ ] 2.4 简化多 provider profile 管理 UI — **暂缓**（YAGNI）：不影响出图正确性，待部署实测后再定；用户已说明「部署后我使用测试后再决定收掉哪些AI功能」
- [ ] 2.5 验证填入 Key 后模型选择器可用 — **需真实子密钥手测**（见 5.5）

## 3. 品牌与统计

- [x] 3.1 `apps/web/index.html` — title / description / keywords / application-name / author / og / twitter / JSON-LD 改为 OpenGDMEC
- [x] 3.2 `apps/web/public/manifest.json`
- [x] 3.3 `apps/web/public/home.html` 与 `apps/web/public/en/home.html`
- [x] 3.4 `package.json` — description
- [x] 3.5 删除统计 script：`index.html`、`home.html`、`en/home.html` 三处 Umami 入口
- [x] 3.6 更新 `umami-analytics.test.ts` — 断言源码不再含 umami 域名与 website id
- [x] 3.7 内部标识符未被误改：`__opentu_tuzi_proxy__`、`__opentu_tuzi_session__`、`aitu-app`、`sw-task-queue`、`__aitu_cache__`、`@aitu/utils`、`opentu.ai` 全部保留
- [x] 3.8 云同步数据契约保留：`github-sync/*`、`TokenGuide.tsx`、`sw-debug/gist-management.js` 未改（Gist 按 `description.includes('Opentu')` 匹配，改前缀会孤立存量用户云端数据）

## 4. 静态托管部署

- [x] 4.1 `apps/web/public/_redirects` — 删除外部代理规则，保留 SEO 301 与 SPA 回退
- [x] 4.2 `netlify.toml` 与 `vercel.json` — 删除外部代理规则
- [x] 4.3 `apps/web/public/_headers` — 承接 CSP 等安全响应头，并移除 umami 来源
- [x] 4.4 确认产物无需 `functions/` 或 `_worker.js`：`dist/apps/web` 下均不存在，纯静态即可
- [x] 4.5 国内对象存储切换步骤已记录于 `design.md` → Migration Plan（仅改域名解析 + 上传 `dist/apps/web`，无需改业务代码）

## 5. 验证

- [x] 5.1 `pnpm typecheck` 全量通过（5 projects）；ESLint 仅剩存量问题（`@nx/enforce-module-boundaries` 在 `workflow-mode/web/src/lib/layout.shared` 上 ENOENT，及改动前既有的 unused-vars），与本次改动无关
- [x] 5.2 `pnpm test` — 175 failed | 2883 passed | 58 failed files，与基线（175/2878/58）**零回归**；失败文件全部为环境类（`localStorage is not defined` 等），新增测试全部通过
- [x] 5.3 `pnpm run build:web` 通过，产物核对：`OpenGDMEC` 已生效、umami 0 处、外部代理 0 处、"AI视频生成" 0 处
- [ ] 5.4 更新 `apps/web-e2e` 依赖视频入口的用例、重建 Playwright 视觉回归基线 — **未做**
- [ ] 5.5 端到端手测：真实 tu-zi 子密钥跑通「粘贴 Key → 提示词 → 出图 → 插入画布」— **需用户执行**
- [x] 5.6 UI 层无视频入口可达：产物 JS 中残留的 `ai-video` 字符串均为非 UI 用途（`toolbar-config-service.ts` LEGACY 检测数组、CSS 类名 `.ai-video-generation-container`、dialog id、事件名），线上 `ALL_BUTTON_IDS` 已无该项
- [ ] 5.7 DevTools 确认无到 `umami.tu-zi.com` 的请求 — **需用户执行**
- [ ] 5.8 部署 Cloudflare Pages 并记录国内可达性实测 — **需用户执行**
