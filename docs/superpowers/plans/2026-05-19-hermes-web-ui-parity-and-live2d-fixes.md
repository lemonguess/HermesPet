# Hermes Web UI Parity And Live2D Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smooth Live2D eye reset, fix dark outfit switching, and extend the chat window toward the hermes-web-ui left navigation and backend module shape.

**Architecture:** Keep HermesPet local-first. Renderer UI remains in `ChatApp.vue`; reusable Live2D behavior moves into small tested modules. Backend parity follows hermes-web-ui's controller/service boundary but maps it to Electron main IPC services instead of Koa routes.

**Tech Stack:** Electron IPC, Vue 3, TypeScript, Node built-in tests, Live2D Cubism params/parts, Hermes CLI.

---

### Task 1: Live2D Look And Outfit Runtime

**Files:**
- Create: `src/renderer/src/live2d/look-controller.ts`
- Create: `src/renderer/src/live2d/outfit-presets.ts`
- Modify: `src/renderer/src/components/Live2DStage.vue`
- Modify: `src/renderer/src/components/InteractionPanel.vue`
- Test: `tests/live2d-look-and-outfit.test.ts`

- [x] **Step 1: Write failing tests**
- [x] **Step 2: Verify tests fail because modules are missing**
- [x] **Step 3: Implement look easing and outfit presets**
- [x] **Step 4: Verify tests pass**

### Task 2: Hermes Dashboard Backend Boundary

**Files:**
- Create: `src/main/hermes/hermes-dashboard-service.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/env.d.ts`
- Modify: `src/shared/ipc-channels.ts`
- Modify: `src/shared/types.ts`

- [x] **Step 1: Add IPC contracts for profiles/models/logs/summary**
- [x] **Step 2: Implement read-only backend service referencing hermes-web-ui's services/controllers**
- [x] **Step 3: Surface data to renderer through preload**

### Task 3: Chat Window Navigation Parity

**Files:**
- Modify: `src/renderer/src/chat/ChatApp.vue`

- [x] **Step 1: Add collapsible conversation list**
- [x] **Step 2: Replace flat left nav with grouped secondary menu**
- [x] **Step 3: Route implemented modules to real panels and unsupported modules to honest placeholders**

### Task 4: Docs And Verification

**Files:**
- Create: `docs/iteration-012-hermes-web-ui-parity-and-live2d-fixes.md`
- Modify: `docs/README.md`

- [x] **Step 1: Write iteration log**
- [x] **Step 2: Run tests, typecheck, build, dev smoke**
- [x] **Step 3: Use Browser for screenshot-level localhost verification**
