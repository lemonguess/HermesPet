# iteration-012 — hermes-web-ui-parity-and-live2d-fixes

- **日期**: 2026-05-19
- **范围**: 平滑 Live2D 视线回正、修复暗黑服装切换、补齐 hermes-web-ui 风格导航与只读后端模块边界

## 动机

- 鼠标离开画布后视线回正过快，用户可感知为“突然回正”；同时主进程轮询日志会刷屏。
- 交互模式中的暗黑服装点击没有稳定生效，需要把 UI 操作映射到 tuzi_mian 的实际 part opacity 与服装参数。
- 前一轮只做了会话列表与媒体布局，还缺 hermes-web-ui 左侧一级/二级菜单、模型/日志/网关等模块入口，以及对应后端数据边界。

## 改动

- Live2D 控制
  - 新增 `src/renderer/src/live2d/look-controller.ts`：将鼠标目标与当前视线拆开，离开画布后通过 `stepLookState()` 逐帧缓动回中。
  - 新增 `src/renderer/src/live2d/outfit-presets.ts`：集中定义 `normal` / `dark` 服装 preset，暗黑服装不再只改单个 part。
  - 修改 `src/renderer/src/components/Live2DStage.vue`：beforeModelUpdate 内持续推进视线缓动；服装 preset 通过实际 `Part*` 与 `Param*` 映射执行。
  - 修改 `src/renderer/src/components/InteractionPanel.vue`：暗黑服装点击会同时广播 part opacity 和服装参数。
  - 修改 `src/main/index.ts`：移除 `[Polling]` 鼠标进出日志与宠物参数转发日志。
- hermes-web-ui 导航与后端参考
  - 参考 `EKKOLearnAI/hermes-web-ui` 的客户端 `AppSidebar.vue` 分组，以及服务端 `routes/index.ts`、`controllers/hermes/models.ts`、`controllers/hermes/logs.ts`、`services/hermes/gateway-manager.ts`、`services/hermes/hermes-profile.ts` 的边界。
  - 新增 `src/main/hermes/hermes-dashboard-service.ts`：不引入 Koa，按 Electron main IPC 提供 dashboard summary / models / logs。
  - 修改 `src/shared/ipc-channels.ts`、`src/shared/types.ts`、`src/preload/index.ts`、`src/renderer/src/env.d.ts`：补齐 dashboard IPC 与 preload 类型。
  - 修改 `src/renderer/src/chat/ChatApp.vue`：左侧导航改为对话 / 代理 / 监控 / 系统分组；会话列表支持收起/展开；模型、日志、网关进入真实面板，其余入口显示明确的 planned/partial 状态。
- 测试
  - 新增 `tests/live2d-look-and-outfit.test.ts`：覆盖视线缓动回正与暗黑服装 preset。
  - 扩展 `tests/agent-ipc.test.ts`：覆盖 Hermes dashboard IPC channel。

## 验证方式

- `pnpm exec tsc -p tests/tsconfig.json`
- `node --test /private/tmp/hermespet-tests/tests/runtime-stream-parser.test.js /private/tmp/hermespet-tests/tests/agent-ipc.test.js /private/tmp/hermespet-tests/tests/live2d-look-and-outfit.test.js`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- `pnpm dev` + Browser 打开 `http://localhost:5173/chat.html`：
  - 截图确认 grouped sidebar、会话列表收起按钮、模型模块可渲染。
  - DOM 验证左侧入口包含：对话、历史、群聊、搜索、中转站、任务、看板、频道、技能、插件、记忆、模型、日志、用量、技能用量、网关、用户、交互模式、设置。
  - 控制台 error 日志为空。

## 已知问题 / 留给下一轮

- 模型 / 日志 / 网关目前是只读或部分可执行面板，任务、看板、频道、技能、插件、记忆、用量、技能用量仍是占位入口。
- Browser 只能验证 `chat.html` 渲染；透明 Electron pet 窗口的 Live2D 视觉效果仍依赖运行时测试和本地手动观察。
- dashboard 的模型发现先从 Hermes profile 的 `auth.json` / `config.yaml` 做保守读取；若 Hermes CLI 提供稳定的机器可读命令，后续应替换为 CLI 输出解析。
