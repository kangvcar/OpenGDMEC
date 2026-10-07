## Context

`add-gdmec-teacher-edition` 收敛了功能面（视频/音频/工作流入口）与接入路径（预置 provider + 手动粘贴 Key），
但没有收敛「设置面板」本身的入口。本 change 处理这一层残留，改动面很小（约 5 个文件），
但有两个容易踩的坑：窗口渲染不能停、手势方案要与既有决策对齐。

关键事实（已核实）：

- 配置读写与设置面板零耦合：`settings-manager.ts` 的 `geminiSettings` 单例自管 localStorage + IndexedDB 同步；
  MCP 那批工具只 `get()` 从不 `update()`；生成参数默认值在 `ai-generation-preferences-service.ts` 自管。
  → 藏掉入口，出图链路零改动。
- 设置面板是 **WinBox 窗口**而非 Dialog/Drawer，由 `appState.openSettings` 控制，挂载于
  `drawnix.tsx` 的工作流分支与主分支两处。
- 设置面板里有、别处没有的东西只有四样：供应商表单、模型预设、画布「任务进度卡片」开关、语音播放面板。
  前三样正是要锁的；语音播放对应的音乐播放器已不在教师版工具目录里，够不到。
- 主题（工具栏）、备份恢复 / 云同步 / 清除画布（菜单）、版本更新（工具栏）、模型切换 / 分辨率 / 数量
  （AI 输入栏）都不在设置里，不受影响。

## Goals / Non-Goals

- Goals：老师在任何路径上都到不了设置面板；排障时管理员能远程指导打开它；改动不碰出图链路。
- Non-Goals：不删实现、不加 feature flag、不引入账号或权限系统。

## Decisions

### Decision 1：窗口渲染必须保留，只摘入口

`ToolboxDrawer.tsx` 监听 `openSettings` 由真变假来恢复被挂起的工具操作。若改成「入口摘掉 + 窗口不渲染」，
一旦有任何代码路径把 `openSettings` 置真（未来新增、或存量遗漏），窗口不会出现，等待恢复的监听会永久挂着
—— 从「弹出一个多余的面板」退化成「静默死路」，排障成本高得多。因此 `drawnix.tsx` 两处挂载一行不改。

- Alternatives considered：把 `openSettings` 一起废掉、设置面板彻底不挂载 —— 被否，见上。

### Decision 2：管理员入口用「版本行连点 5 次」，不用 feature flag、URL 参数或快捷键

- 与 `add-gdmec-teacher-edition` design.md Decision 1 一致：项目没有既有 feature flag 机制，
  为一个发行版引入开关层是过度设计。管理员与老师跑的是**同一份构建产物**，区分只能落在运行时行为上。
- 不用 URL 参数：分发包一旦带上「打开设置」的查询参数，转发即扩散，且与「密钥不通过 URL 预置」的口径容易混淆。
- 不用键盘组合键：教师多在移动端/触屏上使用，没有键盘；口头指导「菜单最底下那行字，快点 5 下」比
  「按 Ctrl+Shift+Alt+S」可传达得多。
- 计数状态机抽成纯函数 `advanceTap(state, now)`：1.5s 窗口内累计 5 次即触发并归零。
  用 ref 存计数而不引入 `setTimeout`，因此没有定时器清理负担——超窗的判定靠时间戳比较，
  首次点击超窗就重新计数。

### Decision 3：优先级排序，不做「折中态」

本 change 不给面板加只读模式或隐藏部分字段。设置面板的供应商表单与模型预设本就是同一件事的两半
（表单填 Base URL/Key，预设选模型），留一半比全留更危险：老师能改 Key 却不能改模型，
排障时看到的现象与真实配置不一致。要么全开（管理员手势），要么全关（老师侧），不做中间态。

## Trade-offs

- 画布「任务进度卡片」开关与语音播放面板**在老师侧不再有恢复入口**。这是接受的代价：
  进度卡片确认关闭后即不再显示，老师想找回只能找管理员。
  `WorkZoneContent.tsx` 的确认文案已同步删掉「可在设置中恢复显示」这句已不成立的承诺。
- 隐藏手势是**弱保护**，不是安全边界：知道手势的人都能打开面板。本 change 防的是误操作，
  不是防恶意——密钥本就是明文交付给使用者的凭证（沿用 `add-gdmec-teacher-edition` 的 Non-Goals）。

## Migration Plan

无数据迁移。老师侧 localStorage 里既有的供应商配置继续被读取，只是不再有编辑入口；
管理员通过隐藏手势仍可查看与修改。
