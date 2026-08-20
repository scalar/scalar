---
'@scalar/agent-chat': minor
'@scalar/api-reference': minor
---

Add Escape-to-close for the agent panel. The chat kit now emits a `close` event when the user presses Escape (guarding against IME composition and Escape already handled by a nested overlay), and the API Reference drawer maps it to closing the panel from anywhere — even when expanded — while restoring focus to the button that opened it.
