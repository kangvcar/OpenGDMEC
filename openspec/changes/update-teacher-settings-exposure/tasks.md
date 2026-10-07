## 1. 摘入口

- [x] 1.1 `app-toolbar.tsx` — 删 `<Settings />` 渲染与 import
- [x] 1.2 `app-menu-items.tsx` — 删 `Settings` 组件及因此失效的 import（`SettingsIcon`、`queueProviderSettingsNavigation`、`LEGACY_DEFAULT_PROVIDER_PROFILE_ID`）
- [x] 1.3 `command-registry.ts` — 删 `settings-open` 命令对象，保留 `settings-clean`
- [x] 1.4 `ModelDropdown.tsx` — 删 `handleOpenProviderSettings`、供应商按钮整块 `tabsFooter`、`showProviderAction` prop 及其在 `settings-dialog.tsx` 的传参
- [x] 1.5 确认不补空态：`ModelDropdown` 只在 `composerHasCredentials` 为真时渲染，未配 Key 时不存在

## 2. Key 失效改走引导弹窗

- [x] 2.1 `drawnix.tsx` 的 `API_AUTH_ERROR_EVENT` 处理：`setAppState(openSettings: true)` → `void requestAdminApiKey()`
- [x] 2.2 toast 文案改为指向工具栏企业微信图标 / 找管理员换一把新 Key
- [x] 2.3 确认 `promptForApiKey()`（生成前置拦截）与认证错误走的是同一条通道

## 3. 管理员隐藏手势

- [x] 3.1 新增 `menu-version-row.tsx`：只读版本行 + `advanceTap` 纯函数状态机（1.5s / 5 次，无定时器）
- [x] 3.2 `app-toolbar.tsx` 菜单底部（`QuickCommands` 之后）渲染版本行，命中后关菜单 + 置 `openSettings`
- [x] 3.3 版本号取 `__APP_VERSION__`（`typeof` 守卫），不请求 `version.json`
- [x] 3.4 `menu-version-row.test.ts` — 锁「窗口内 5 次触发」「4 次不触发」「超窗重计数」「触发后归零」

## 4. 文案收口

- [x] 4.1 `image-generation-service.ts` / `video-generation-service.ts` / `useTaskExecutor.ts`：删除「请在设置中配置」
- [x] 4.2 `WorkZoneContent.tsx`：进度卡片确认提示删掉「可在设置中恢复显示」
- [x] 4.3 不可达处不改（知识库、视频分析、工作流 i18n、tuzi 引导 hook、ChatDrawer）

## 5. 验证

- [x] 5.1 `pnpm typecheck` + `pnpm lint`
- [x] 5.2 `menu-version-row.test.ts`、`ModelDropdown.test.tsx` 通过
- [x] 5.3 浏览器手测：菜单无「设置」且有版本行；1.5s 连点 5 次开面板、点 4 次停 2s 再点 1 次不开；
      命令面板搜「设置」无结果、「清除画布」仍在；模型下拉无供应商按钮；抹掉 Key 后 toast 新文案 + 引导弹窗
- [x] 5.4 `pnpm e2e:visual` 基线差异逐张确认（菜单少一项、多一行版本号）
- [ ] 5.5 管理员在真机（触屏）上验证连点手势可触发——口头指导的前提是触屏也点得动

## 6. 文档与规范

- [x] 6.1 本 change（proposal / design / tasks / delta spec）
- [x] 6.2 用户手册：删 `advanced/settings.mdx`；改 `advanced/troubleshooting.mdx`、`settings/tuzi-api-configuration.mdx`
- [x] 6.3 手册流水线：`doc-metadata.ts` 的 `settings` 分类条目、`advanced.manual.spec.ts` 的「设置对话框截图」用例、`config.yaml` 的 `settings` 分类
- [x] 6.4 `pnpm manual:build` 重新生成手册产物
