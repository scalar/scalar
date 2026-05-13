---
'@scalar/workspace-store': patch
---

fix: OAuth scope CRUD mutators

- New mutators **`upsertScope`** and **`deleteScope`** backed by new `AuthEvents` entries; **`updateSelectedScopes`** only updates selection state.
- **Rename**: `upsertScope` rewrites the scope key in the flow and mirrors the new key in every document- and operation-level selected requirement for that scheme.
- **Delete**: `deleteScope` removes the scope from the flow and drops it from matching selections.
