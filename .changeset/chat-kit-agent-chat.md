---
'@scalar/agent-chat': minor
---

Recompose `@scalar/agent-chat` onto the shared `@scalar/chat` kit and `@scalar/chat-protocol`. The nine status-badge clones are replaced by `ChatStatusBadge`, streamed replies render through `ChatMarkdown` (completed blocks keep their DOM while streaming), and the prompt form runs on `ChatComposer` — gaining Stop while streaming, the WebKit IME Enter guard, the shared over-limit gate, and the empty-draft disabled treatment. Error parsing and approvals move to `parseChatError()` and the declared policy registry. The empty state adopts the shared bottom-docked prompt pattern, and the free-messages and payment banners wrap cleanly at narrow widths; surface behavior (registry pills, terms gate, payment and upload sections, approvals) is otherwise unchanged. Escape now emits a `close` event for embedders, and the `ai` / `@ai-sdk/vue` catalog versions converge with the org repo (6.0.168 / 3.0.168).
