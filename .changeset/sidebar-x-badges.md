---
'@scalar/api-reference': minor
'@scalar/sidebar': minor
'@scalar/workspace-store': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat: show `x-badges` in the sidebar with the new `showBadgesInSidebar` option

The option is off by default, so the sidebar looks the same as before. When it is on, the sidebar shows the `x-badges` of operations, webhooks, tags (including nested OpenAPI 3.2 tags), `x-tagGroups` entries and models next to their titles. Navigation entries of these types get an optional `badges` field.
