---
'@scalar/chat': patch
---

Add the component layer: ChatStatusBadge (collapses the nine status badge clones), ChatToolCard + ChatDiff (ported from the editor's keystone shell), ChatToolFallbackCard (the primary renderer for dynamic MCP tools, CSS-clamped preview), ChatComposer with stacked and inline layouts plus the iOS zoom guard and IME handling, ChatSend (single 28px size, contrast-correct glyph, send-stop morph with mis-click guard), ChatApprovalBar (action-naming, count-aware, destructive variant), ChatMarkdown (block-memoized streaming rendering with the aria-live contract), and a playground covering every state and both densities
