---
'scalar-app': patch
---

fix(scalar-app): redirect to the correct HTML file on logout in Electron

On Electron the app loads from a `file://` URL and uses hash-based routing, so the previous `window.location.href = '/'` resolved to the filesystem root and broke the app. Logout now resets the hash on the current HTML file and reloads on Electron, while the web build still hard routes to `/`.
