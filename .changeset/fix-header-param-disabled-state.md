---
'@scalar/api-client': patch
---

fix: header parameters with `x-disabled: false` (e.g. `x-scenario-id`) now stay enabled while editing

`RequestTableRow`'s `handleUpdateRow` unconditionally ran `isDisabled.value = payload.isDisabled ?? false`. When `CodeInputLite` fired `@update:modelValue` for the name or value field it called `handleUpdateRow({ name: v })` with no `isDisabled`, which reset the row to enabled on every keystroke and overrode the correct initial state read from `x-disabled`. It now only updates `isDisabled` when it is explicitly present in the payload.
