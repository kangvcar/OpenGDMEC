# Change: 教师侧不再暴露设置面板入口

## Why

老师的 Key 由管理员在 tu-zi 后台创建子密钥（含可用模型与次数）后手动发放，前端已把默认模型写死
（`constants/model-config.ts` 的 `DEFAULT_IMAGE_MODEL_ID='gpt-image-2.5'`、`DEFAULT_TEXT_MODEL_ID='gpt-6-luna'`，
经 `utils/settings-manager.ts` 的 `DEFAULT_SETTINGS` 真正生效）。设置面板里的供应商表单与模型预设对老师
只剩下「把配置改坏」的可能，老师既不需要也不该碰。

但现状是「菜单只是六个门之一」：模型下拉里的「新增供应商」直接进供应商表单（Base URL / API Key 可改），
命令面板能搜到「打开设置」，Key 失效时还会自动弹出整个面板 —— 只摘菜单项等于没锁。

## What Changes

- **收敛教师可达的全部设置入口**：菜单项、命令面板命令、模型下拉的供应商按钮、Key 失效跳转。
- **Key 缺失/失效不再开设置面板**，改为开引导弹窗（`utils/admin-key-guidance-event.ts` 的
  `requestAdminApiKey()`，与 `utils/gemini-api/auth.ts` 的 `promptForApiKey()` 同一条通道）——
  即 `teacher-onboarding` 的「首次配置」从「打开设置面板」改为「引导弹窗」。
- **新增管理员隐藏手势**：菜单底部版本行 1.5s 内连点 5 次打开设置面板（口头指导即可传达，移动端可用）。
- **设置面板实现与窗口渲染全部保留**：`drawnix.tsx` 两处挂载（工作流分支与主分支）不动。
  `openSettings` 置真而窗口不渲染，会让 `ToolboxDrawer.tsx` 那类「等窗口关闭后续跑」的监听永久挂起。
- **文案收口**：「请在设置中配置」一类指向已不存在入口的提示改为指向工具栏企业微信图标 / 联系管理员；
  画布任务进度卡片开关的确认提示删掉「可在设置中恢复显示」这句已不成立的承诺。

## Non-Goals

- **不删除**设置面板本体、模型发现弹窗、tuzi 账户面板、供应商表单代码。
- **不按发行档位加 feature flag**：沿用 `add-gdmec-teacher-edition` design.md Decision 1 的结论。
- **不改配置读写路径**：`geminiSettings` 单例、`ai-generation-preferences-service` 与设置面板零耦合，
  藏入口对出图链路零影响。
- **不收敛工具箱的「缺 Key 开设置」分支**（`ToolboxDrawer.tsx`）：其前置条件是
  `tool.url && needsApiKeyConfiguration(tool.url)`，教师版目录的工具走 `component` 不走 `url`，
  该分支不可达，改动是给不存在的场景写代码。
- **不补模型下拉的「未配置 Key」空态**：`ModelDropdown` 只在 `composerHasCredentials` 为真时渲染
  （`AIInputBar.tsx`），未配 Key 时它根本不出现，输入栏那行提示已经承担了表达。

## Impact

- Affected specs：`teacher-onboarding`（MODIFIED 一个 requirement + ADDED 一个 requirement）
- Affected code：
  - 摘入口：`components/toolbar/app-toolbar/app-toolbar.tsx`、`…/app-menu-items.tsx`、
    `components/command-palette/command-registry.ts`、`components/ai-input-bar/ModelDropdown.tsx`、
    `components/settings-dialog/settings-dialog.tsx`（去掉 `showProviderAction` 传参）
  - 新增：`components/toolbar/app-toolbar/menu-version-row.{tsx,scss}`（版本行 + 连点手势状态机）
  - 改跳转：`drawnix.tsx` 的 `API_AUTH_ERROR_EVENT` 处理
  - 文案：`services/media-generation/{image,video}-generation-service.ts`、`hooks/useTaskExecutor.ts`、
    `components/workzone-element/WorkZoneContent.tsx`
- Affected tests：`ModelDropdown.test.tsx`（删供应商按钮用例）、新增 `menu-version-row.test.ts`、
  e2e 视觉基线（菜单少一项、底部多一行版本号）
- Affected docs：用户手册 `advanced/settings.mdx`（删除整页）、`advanced/troubleshooting.mdx`、
  `settings/tuzi-api-configuration.mdx`
- 与 pending change `add-gdmec-teacher-edition` 的关系：本 change 的 MODIFIED delta 覆盖其
  `teacher-onboarding` 中「教师首次打开设置面板」的表述，两者可独立归档；本 change 后归档。
