---
'@scalar/agent-chat': minor
---

Recompose agent-chat onto the `@scalar/chat` kit: the nine status-badge clone components are replaced by `ChatStatusBadge`, streamed replies render through `ChatMarkdown` (completed blocks keep their DOM while streaming), and the prompt form runs on `ChatComposer` — gaining Stop while streaming, the WebKit IME Enter guard, and the shared over-limit gate. Surface behavior (registry pills, terms gate, payment and upload sections, approvals) is unchanged.
