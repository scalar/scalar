---
'scalar-app': patch
---

fix(scalar-app): restrict the Electron `customFetch` handler to `http:` and `https:` schemes so requests cannot be redirected to `file:`, `data:`, or other non-network protocols that could read local resources through undici
