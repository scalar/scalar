---
'@scalar/api-reference': patch
---

Prepare the initial document before hydrating server-rendered API references, preserving the existing content during slow or failed loads. Keep server-rendered sections mounted and defer browser-only UI until hydration completes. Export `prepareApiReference` for custom Vue SSR integrations.
