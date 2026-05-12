---
'scalar-app': patch
---

fix: enable transparent Electron window to reduce resize flash

The desktop shell uses a dark-themed surface; Electron’s default backing color can show through briefly while the webview repaints during aggressive window resizing. A transparent window lets the renderer’s own background (CSS / theme) own what users see in those gaps.