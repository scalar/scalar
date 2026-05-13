---
'@scalar/workspace-store': minor
'@scalar/oas-utils': minor
---

feat: UID-based workspaces and local-team migration

IndexedDB v2 migrates existing data into the new shape, collapses all workspaces into the local team (aligned with a single team workspace on the client for now), resolves slug collisions deterministically, re-keys chunk stores by workspaceUid, and strips x-scalar-tabs and x-scalar-active-tab from meta chunks so routing does not follow stale paths after migration or slug changes.