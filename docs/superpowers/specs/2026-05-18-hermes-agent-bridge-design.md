# Hermes Agent Bridge Design

- **Date**: 2026-05-18
- **Status**: Approved for implementation
- **Reference**: `EKKOLearnAI/hermes-web-ui` Bridge path (`source=cli -> AgentBridgeClient -> hermes_bridge.py -> AIAgent.run_conversation()`)

## Goal

Replace the renderer-side localhost OpenAI-compatible chat call with an Electron main-process Hermes Agent Bridge, while keeping HermesPet's desktop pet Runtime layer as the owner of Live2D, speech, motion, emotion, media, and tool intent execution.

## Non-goals

- Do not fork or patch Hermes Agent.
- Do not add multi-provider abstraction inside HermesPet.
- Do not make chat bubbles show protocol parameters.
- Do not implement CosyVoice HTTP integration yet.

## Architecture

```text
ChatApp.vue
  -> preload contextBridge
  -> Electron IPC
  -> HermesBridgeService (main process)
  -> HermesBridgeClient (newline JSON over local socket)
  -> hermespet_bridge.py
  -> run_agent.AIAgent.run_conversation()
```

The renderer no longer calls `http://127.0.0.1:8642/v1/chat/completions` directly. Electron main owns Hermes process lifetime, starts a Python bridge subprocess, and streams structured run events back to the renderer over IPC.

The Python bridge follows the same core model as `hermes-web-ui`, but HermesPet keeps the bridge small:

- one `AIAgent` instance per HermesPet conversation id;
- `chat`, `get_output`, `interrupt`, and `shutdown` actions;
- streamed text deltas via `stream_callback`;
- lightweight event capture for reasoning, status, tool, and approval events when available;
- profile/model/provider are inherited from the user's normal Hermes configuration.

## Message Flow

1. ChatApp creates or opens a local HermesPet conversation.
2. User sends text.
3. ChatApp calls `window.hermes.agent.send({ sessionId, message, history, instructions })`.
4. Main starts the bridge if needed, sends `chat` to Python, then polls `get_output`.
5. Main emits IPC events scoped by `runId` and `sessionId`.
6. Renderer feeds deltas into the HRP stream parser.
7. Renderer appends only `TextPart` content to the visible chat bubble.
8. Renderer stores the filtered display text plus AST metadata for future runtime/debug use.

## HRP Filtering

Hermes may return mixed protocol output:

```xml
主人回来啦～
<emotion value="happy" intensity="0.8" />
<motion action="wave" />
<speech tone="soft" speed="1.0" emotion="happy">主人辛苦啦～</speech>
```

The chat bubble displays only:

```text
主人回来啦～
```

The Runtime parser still emits:

- `TextPart` for visible message text;
- `SpeechPart` for TTS intent and speech parameters;
- `EmotionPart` for abstract emotion intent;
- `MotionPart` for abstract motion intent;
- `MediaPart`, `ToolPart`, and `StatusPart` for future runtime handling.

The parser must be streaming-safe: split tags and half-open tags must work across chunks. It must not depend on whole-response cleanup.

## Runtime Boundary

Chat UI is a projection of the AST, not the source of truth. Motion/emotion/speech parameters are parsed and retained, but execution remains through HermesPet Runtime modules. Abstract intent strings are never passed directly to the Live2D SDK.

## Failure Handling

- If the bridge cannot start, the chat bubble shows a user-facing error and the connection status becomes disconnected.
- If a run fails, main emits `run.failed` and the renderer stops streaming.
- If the user clicks stop, renderer sends `interrupt`; main forwards it to the bridge.
- If Hermes asks for tool approval before an approval UI exists, the bridge records the event and denies by default rather than hanging the desktop pet.

## Verification

- Unit tests cover HRP streaming parser split-tag behavior and visible-text filtering.
- `pnpm typecheck` must pass.
- `pnpm build` must pass.
- `python3 -m py_compile src/main/hermes/hermespet_bridge.py` must pass.
- Manual dev smoke test: send a response containing text plus `<emotion>`, `<motion>`, and `<speech>` tags; chat shows only text while AST contains protocol parts.
