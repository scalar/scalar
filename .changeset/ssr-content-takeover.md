---
'@scalar/api-reference': minor
'@scalar/server-side-rendering': patch
---

Server-side rendered API references now hydrate without mismatches. The server markup is reused during hydration as an opaque node (no serialized state in the response, no re-parsing on the hydration path) and the interactive reference takes over once its document has loaded. This keeps the full content in the initial HTML for SEO while fixing the hydration errors tracked in #4458.
