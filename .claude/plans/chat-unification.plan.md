# Chat unification — reconciled execution plan

**2026-08-18.** This document reconciles the three governing documents and records the
Phase 0 decisions as executed. Where they conflict, precedence is:

1. **"Chat unification: a redline"** (2026-08-17) — sequencing and packaging
2. **"Chat consolidation — design review & final direction"** (2026-08-15) — UX/design spec (A1–A14, C1–C2)
3. **"One chat, four surfaces"** (July 2026) — everything neither of the above amends

## The reconciled shape

- **Two packages, both in OSS `scalar/scalar`:**
  - `@scalar/chat-protocol` — framework-free: tool name constants + schemas, dynamic-tool
    model, typed error envelope + `parseChatError()`, approval policy types, limits,
    scrubbed fixtures. Zod 4 for schemas (decision D-0.2 below).
  - `@scalar/chat` — Vue kit of primitives. Scoped CSS over `--scalar-*` tokens
    (redline E8 overrides the team plan's Tailwind mandate). Design per the feedback
    doc's amended constitution: `ChatRoot` density axis (A1), composer-docked
    approvals (A14), `ChatMarkdown` with block memoization (A7), `ChatViewport`
    per the hardened A6 spec (no `dvh`/`vh`, clamp + threshold + release + epoch guard).
- **Sequencing (redline order):** kit is extracted from `@scalar/agent-chat` and consumed
  by it in the same phase — OSS-only, no donor freeze, no org coordination. Session core
  is ported from the org's Docs/Editor composables *first* so the kit is designed against
  three surfaces and validated against one. Org surfaces migrate after (MCP → Docs → Editor).

## Phase 0 decisions — executed / recorded

### D-0.1 AI SDK convergence — DONE (this branch)
OSS catalog bumped: `ai` 6.0.33 → **6.0.168**, `@ai-sdk/vue` 3.0.33 → **3.0.168**
(matches org `catalog:agent`). `truncate-json` already aligned at 3.0.1.
Org side note (redline E9): org isolates these in `catalog:agent`; OSS keeps them in the
default catalog. No OSS catalog restructuring needed for convergence.

### D-0.2 Schema representation — ZOD 4
The redline's blocking question (E7) resolves to zod, from code evidence:
- zod is **already in the OSS catalog** (`^4.3.5`; org is on 4.3.6) — not a new dependency.
- zod 4 implements Standard Schema, which the AI SDK's `tool({ inputSchema })` requires.
- `@scalar/validation` does not implement Standard Schema.
- `services/agent` is zod throughout (`@hono/zod-openapi`, `@hono/zod-validator`).

Consequence: `@scalar/chat-protocol` has exactly one runtime dependency (`zod`).
The existing agent-chat entities (written with `@scalar/validation`) are ported to zod
as they move; `@scalar/validation` stays the house library elsewhere.

### D-0.3 Licensing / disclosure — GATED, not blocking local work
Org-authored code that moves to MIT OSS: 9 Editor tool-part components, the
`EditorAgentToolCard` shell, the Docs panel + session composables, and the
editor/docs/mcp tool schemas. **Authoring happens on this branch; nothing org-derived
is pushed or published until sign-off.** The OpenAPI-domain schemas (already OSS in
`agent-chat/src/entities`) carry no such gate.

### Dropped Phase 0 gates (per redline E1/E2)
- Two-repo sign-off: already the status quo (`services/agent` imports 4 OSS packages;
  org consumes `@scalar/agent-chat@0.12.26` from npm — catalog has caught up since the
  redline was written).
- Fast-lane publish pipeline: not needed; the remaining tooling item is a catalog-bump
  bot in the org repo (half a day, not a gate).

## Phase 1 — `@scalar/chat-protocol` (this branch)

Contents: OpenAPI-domain tool schemas ported from `agent-chat/src/entities` (4 tools:
`search-openapi-operations`, `execute-request`, `summarize-openapi-specs`,
`ask-for-authentication`); dynamic-tool model for MCP; error envelope
`{ code, message, detail, upgradeUrl? }` + `parseChatError()` (subsumes agent-chat's
`use-chat-error` JSON-in-`Error.message` parsing); approval policy types (declarative
per-tool registry replacing the `method !== 'get'` heuristic); limits
(`MAX_PROMPT_SIZE`); scrubbed fixtures + CI grep for org hostnames/UUIDs.
Editor/docs/mcp domain schemas: authored behind D-0.3, org-side mirror remains
authoritative until sign-off.

### D-1.1 Decline encoding — SDK-native, dual-mode (F9 resolved)
The AI SDK ships first-class tool approval in **both** converged versions (it is not
new in 6.0.168): `approval-requested` / `approval-responded` / `output-denied` part
states and `chat.addToolApprovalResponse({ id, approved, reason? })`, plus native
`stop()` and `clearError()`. The `USER_DENIED` sentinel is **not** created.
Caveat from recon: `services/agent` has zero approval code today — no tool sets
`needsApproval`, so no `approval-requested` part is ever emitted. Approval is decided
client-side from `input-available` + heuristics. Therefore the protocol's approval
layer is dual-mode: (a) policy-registry-driven client-side approvals (today's flow —
approve executes + `addToolOutput`, reject emits the legacy `output-error` encoding
the server understands), and (b) SDK-native `approval-requested` parts answered via
`addToolApprovalResponse` (activates when the server adopts `needsApproval`; the
editor's structured-rejection loop maps onto `approval.reason`). Renderers accept old
persisted encodings ("The user denied the request.", the editor's write_file
rejection message) forever. The 6.0.43/6.0.63/6.0.157/6.0.158 patches fix exactly
this approval + `sendAutomaticallyWhen` interplay — a concrete reason the convergence
landed first.

## Phase 2 — `@scalar/chat` extracted from `@scalar/agent-chat`

Order inside the phase (the redline's discipline requirement):
1. Session core ported from org donors (`useAgentChat.ts` 363 lines,
   `useEditorAgentChat.ts` 505 lines): `createChatContext`, `useChatHistory`
   (IndexedDB, keeps existing DB names, migrate-on-read), `useChatError`,
   `useChatScroll` (container-relative per A6 — never `window`), approval store (F10).
2. `ChatRoot` (density variables per A1 — first thing built), `ChatMarkdown` (A7),
   presentational primitives extracted up from agent-chat (badge set collapses 9 clones),
   composer decomposed from `PromptForm` (~590 lines), `ChatSend` single 28px size with
   `background-1` glyph (A3/A4).
3. `EditorAgentToolCard` copied in as the `ChatToolCard` shell (E5) — scoped CSS kept.
4. `@scalar/agent-chat` rebuilt on the kit, keeping the 11-prop `Chat` facade
   (2 call sites: `agent-web/Overview.vue`, `api-reference/AgentScalarChatInterface.vue`);
   facade contract test is a Phase 2 prerequisite (redline second-order risk).

Ships as product: history, sessions, stop, error retry on agent.scalar.com.

## Phase 3 — org surfaces (org repo, later)

MCP → Docs → Editor, per the team plan §5 Phase 3 cautions (IndexedDB names,
frozen clients, SSR, `redirectToProxy` seam), onto a kit that already has a shipped
consumer. Editor's in-card Apply/Reject moves to the composer-docked ApprovalBar (A14).

## Open questions (carried, non-blocking)

1. Does `@scalar/agent-chat` keep its name for the OpenAPI app, or become the kit?
2. Kit ownership / OSS chat PR review.
3. `ApiEditor.vue` + `projects/editor` chat mounting (org consumer list: 3 or 5).
4. Bulk-approve caps; MCP session persistence; i18n catalog vs props; a11y bar
   (recommendation from all three docs: aria-live + focus + keyboard in v1).
