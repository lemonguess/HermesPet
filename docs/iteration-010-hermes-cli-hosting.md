# iteration-010 — hermes-cli-hosting

- **日期**: 2026-05-18
- **范围**: 增加 Hermes CLI 托管面板（profile/gateway 管理），不改现有聊天链路

## 动机

- 仅靠 “localhost API Base URL” 不足以覆盖本机 Hermes 的启动/停止/切换 profile 等运维动作
- 参考 hermes-web-ui 的思路，把 “Hermes 进程生命周期/状态” 作为桌宠 Runtime 的一部分（但本轮不引入 BFF/HTTP 代理，也不改聊天链路）

## 改动

- 新增 IPC
  - [ipc-channels.ts](file:///Users/lixincheng/workspace/HermesPet/src/shared/ipc-channels.ts)：新增 HermesCli.* 信道
  - [types.ts](file:///Users/lixincheng/workspace/HermesPet/src/shared/types.ts)：新增 HermesCliResult/HermesGatewayStatus
- Main 进程：Hermes CLI 调用与托管
  - [hermes-cli.ts](file:///Users/lixincheng/workspace/HermesPet/src/main/hermes/hermes-cli.ts)：execFile('hermes') 封装；profile list；gateway start/stop/status/restart
  - [hermes-cli-service.ts](file:///Users/lixincheng/workspace/HermesPet/src/main/hermes/hermes-cli-service.ts)：注册 IPC handlers
  - [index.ts](file:///Users/lixincheng/workspace/HermesPet/src/main/index.ts)：启动时注册 HermesCliService
- Preload/Renderer：暴露 API + UI 面板
  - [preload/index.ts](file:///Users/lixincheng/workspace/HermesPet/src/preload/index.ts)：window.hermes.hermesCli
  - [env.d.ts](file:///Users/lixincheng/workspace/HermesPet/src/renderer/src/env.d.ts)：补齐类型
  - [ChatApp.vue](file:///Users/lixincheng/workspace/HermesPet/src/renderer/src/chat/ChatApp.vue)：系统设置页新增 “Hermes CLI 托管” 面板（profile 选择、gateway 状态、启动/停止/重启、CLI 输出折叠）
- 文档
  - [README.md](file:///Users/lixincheng/workspace/HermesPet/README.md)：更新 Hermes 配置说明，强调 renderer 不直连 localhost API，CLI 托管在设置页完成

## 验证方式

- `pnpm typecheck`
- `pnpm build`
- 启动桌宠后打开聊天窗口 → 系统设置 → Hermes CLI 托管：
  - 能检测到 `hermes` 命令
  - 能列出 profiles
  - 点击 刷新/启动/停止/重启 不报错，并能看到 CLI 输出

## 已知问题 / 留给下一轮

- gateway 状态解析目前是启发式（基于输出关键字）；如需更准确可改为 health check + PID/port 诊断（参考 hermes-web-ui 的 GatewayManager）
- 远端 Hermes（/v1/chat）仅作为方向约束，本轮未接入

