---
'@scalar/chat': minor
---

Add `@scalar/chat`, the shared Vue chat kit. The session core is ported from the converged org implementations (a Map of Chat instances, IndexedDB history with migrate-on-read that keeps existing database names, the two-watcher persistence pair, lazy restore), alongside the dual-mode approval store, `useChatError`, and `ChatRoot` (density axis + injectable copy dictionary). Components: `ChatViewport` (hardened reserved-min-height scroll anchor), `ChatComposer` (stacked/inline layouts, iOS zoom guard, IME handling), `ChatSend` (send/stop morph with a mis-click guard), `ChatMarkdown` (block-memoized streaming with an aria-live contract), `ChatStatusBadge`, `ChatToolCard` + `ChatDiff`, `ChatToolFallbackCard` for dynamic MCP tools, and `ChatApprovalBar`. Controls run on `--scalar-color-blue` with a quiet composer focus (the colored ring is opt-in via `--chat-composer-focus-border`), and a playground covers every state and both densities.
