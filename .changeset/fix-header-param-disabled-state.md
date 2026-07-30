---
'@scalar/api-client': patch
---

fix: header parameters with `x-disabled: false` (e.g. `x-scenario-id`) now stay enabled on GET and DELETE endpoints

Two bugs caused optional header parameters to appear disabled even when the OpenAPI spec explicitly set `x-disabled: false` on their example:

1. **`RequestTable.vue`** — the `v-for` loop used `:key="index"`, so Vue reused the same `RequestTableRow` component instance when the row list changed length (GET/DELETE have fewer default headers than POST). The stale instance kept its previous `isDisabled` ref value. Fixed to `:key="row.name ? \`${row.name}-${index}\` : index"` so named rows always get a stable, unique key.

2. **`RequestTableRow.vue`** — `handleUpdateRow` unconditionally ran `isDisabled.value = payload.isDisabled ?? false`. When `CodeInputLite` fired `@update:modelValue` for the name or value field it called `handleUpdateRow({ name: v })` with no `isDisabled`, which reset the row to enabled regardless of its correct initial state. Fixed to only update `isDisabled` when it is explicitly present in the payload.
