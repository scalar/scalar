---
'@scalar/api-client': patch
---

feat: show copy button on large request bodies in the request panel

When a raw request body exceeds 20 000 characters, the CodeMirror editor is replaced with `ScalarVirtualCodeBlock` — a virtualized renderer with a copy button. This matches the existing behaviour in the response panel (`ExampleResponse.vue` / `ExampleSchema.vue`) and avoids CodeMirror performance issues on very large payloads.

Bodies below the threshold continue to use the full CodeMirror editor as before.
