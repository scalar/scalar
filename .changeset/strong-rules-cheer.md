---
'@scalar/api-reference': patch
---

Clean up the standalone build's injected `<head>` styles on `destroy()` so they no longer linger after SPA-style navigation (Turbo Drive, htmx). The styles are re-attached when a new instance mounts.
