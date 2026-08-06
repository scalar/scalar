---
'@scalar/api-reference': patch
'@scalar/components': patch
---

fix: resolve axe-core ARIA violations in the API reference sidebar and client tabs

Sidebar items used `aria-selected` on links/buttons (invalid for those roles) and the search trigger used `role="search"` on a button. Selected items now use `aria-current="page"`, the search control is a plain named button, and the sidebar no longer sets an invalid `role="navigation"` on `<aside>` (it keeps the default complementary landmark).

Client library and SDK installation "More" comboboxes sat inside `role="tablist"`, which fails `aria-required-children`. They now sit beside the tablist. MCP install controls without a target URL render as buttons instead of empty `a[href=""]` links.
