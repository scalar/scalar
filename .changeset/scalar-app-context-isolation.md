---
'scalar-app': patch
---

chore: explicitly enable `contextIsolation` and `nodeIntegration: false` on the desktop app's BrowserWindow to satisfy the toDesktop static analysis check (these were already the secure Electron defaults at runtime)
