# iteration-011 — web-ui-parity-media-and-layout

- **日期**: 2026-05-18
- **范围**: 对齐 hermes-web-ui（image2.png）关键交互：会话左栏常驻 + 图片附件

## 动机

- hermes-web-ui 的主界面（image2.png）包含：左侧常驻会话列表、对话内展示图片、输入区支持附件
- HermesPet 现有聊天窗以“下拉历史 + 纯文本” 为主，缺少上述关键交互，导致功能观感差距明显

## 改动

- 媒体导入（媒体安全：统一落到 `~/HermesPet_Media/`）
  - [ipc-channels.ts](file:///Users/lixincheng/workspace/HermesPet/src/shared/ipc-channels.ts)：新增 `IPC.Media.Import`
  - [types.ts](file:///Users/lixincheng/workspace/HermesPet/src/shared/types.ts)：新增 `MediaImportRequest/MediaImportResult`
  - [media-service.ts](file:///Users/lixincheng/workspace/HermesPet/src/main/media/media-service.ts)：main 进程拷贝文件到 `~/HermesPet_Media/<conversationId>/`，返回 `file://` URL 作为 `MediaPart.src`
  - [index.ts](file:///Users/lixincheng/workspace/HermesPet/src/main/index.ts)：注册 MediaService
  - [preload/index.ts](file:///Users/lixincheng/workspace/HermesPet/src/preload/index.ts) + [env.d.ts](file:///Users/lixincheng/workspace/HermesPet/src/renderer/src/env.d.ts)：暴露 `window.hermes.media.import`
  - 文件选择路径通过 Electron `webUtils.getPathForFile(file)` 获取，避免依赖非标准 `File.path`
- 聊天 UI
  - [ChatApp.vue](file:///Users/lixincheng/workspace/HermesPet/src/renderer/src/chat/ChatApp.vue)：
    - Chat 视图改为双栏布局：左侧会话列表常驻（搜索/新建/删除），右侧聊天流
    - 输入区新增图片附件（本地选择 → 导入 → 预览 → 发送）
    - 消息气泡支持渲染 `MessagePart.kind === 'media'` 的图片内容

## 验证方式

- `pnpm typecheck`
- `pnpm build`
- 手动：聊天窗口 → 新建对话 → 点击附件选择图片 → 发送 → 图片在气泡内显示；重开窗口后历史消息仍可回显图片

## 已知问题 / 留给下一轮

- 本地 Bridge 当前不支持把图片作为多模态输入传给模型；目前仅在上下文中以 “Attachment: …” 文本提示注入
- 仅实现了图片附件；音频/视频/文件的 UI 与预览策略待补
