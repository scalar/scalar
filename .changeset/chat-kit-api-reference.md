---
'@scalar/api-reference': minor
---

Add the Ask AI agent panel: a right-hand side panel replacing the old drawer (no backdrop overlay), resizable via a drag handle on its inner edge (persisted width clamped between 360px and 75% of the viewport, double-click to reset, keyboard resize with ARIA value upkeep) and expandable to content width, with a header MCP menu offering Cursor / VS Code install links. The chat surface is lazy-mounted on first open, runs on the `@scalar/chat` kit (whose stylesheet is now loaded), and closes on Escape from anywhere — even when expanded — restoring focus to the button that opened it. Includes the agent panel and MCP menu translation keys for every built-in locale.
