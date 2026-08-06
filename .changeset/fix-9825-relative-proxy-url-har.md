---
'@scalar/workspace-store': patch
---

fix: resolve relative request URLs against the current origin in `fetchRequestToHar`

A relative `proxyUrl` (e.g. `/api/scalar-proxy`) makes `redirectToProxy` return a relative URL, which `new URL()` could not parse, so every request threw `TypeError: Invalid URL` and never made it into history.
