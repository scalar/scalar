---
'@scalar/workspace-store': patch
---

Fixed a `NotFoundError: The specified index was not found` crash on startup for installs created by `@scalar/workspace-store@0.48.x`–`0.49.x`. The v2 IndexedDB migration was rewritten in place without bumping the schema version, so those installs were stranded on the superseded schema (no `teamSlug_slug` index) and never re-ran migrations. A new v3 migration brings them up to the current UID-based shape and is a no-op for installs already on it.
