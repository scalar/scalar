---
'@scalar/components': patch
'scalar-app': patch
---

Fix the app header overflowing horizontally on narrow and mobile viewports. `ScalarHeader` no longer pins itself to `min-w-min` or forces every section to equal width, so the start section (menu and breadcrumb) can shrink and ellipsize instead of pushing the header past the viewport. The `ScalarMenu` trigger stays icon-sized via an inline-flex, non-shrinking wrapper.
