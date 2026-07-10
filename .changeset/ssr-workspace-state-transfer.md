---
'@scalar/api-reference': patch
---

Pass the loaded document from the server to the client during SSR so the first client render matches the server markup. Previously the server rendered the full reference while the client hydrated an empty loading state, causing hydration mismatches.
