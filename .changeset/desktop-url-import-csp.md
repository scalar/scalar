---
'scalar-app': patch
---

Fix importing OpenAPI documents from a URL in the desktop app. The temporary draft store used during import now reuses the IPC-backed fetch, so URL imports no longer get blocked by the Content Security Policy.
