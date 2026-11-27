---
'@scalar/components': patch
---

feat(components): add stable styling hooks to the sidebar

Layouts can now target the sidebar without relying on Tailwind utilities. Elements carry `scalar-sidebar-items`, `scalar-sidebar-nested-items`, `scalar-sidebar-nested-items-panel`, `scalar-sidebar-button` and `scalar-sidebar-search-shortcut` classes, and open state is exposed as `data-nested-open` on a list while a nested item inside it is open and `data-open` on the open nested item. The `group/nested-items-open` class is deprecated in favor of `data-open`.
