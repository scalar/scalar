---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-reference': minor
---

Keep request and response example pickers in sync across operations. Selecting an example (e.g. "Use case 1") now selects the example with the same key on every other operation that defines it, mirroring how the programming-language selection already syncs. Operations that do not have a matching example keep their current selection.
