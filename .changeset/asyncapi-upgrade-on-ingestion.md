---
'@scalar/workspace-store': patch
---

Run the AsyncAPI upgrader when ingesting AsyncAPI documents so 1.x/2.x specs are converted to the 3.x shape the renderer expects. Previously a 2.x document (operations nested under channels as `publish`/`subscribe`) was passed through unchanged, leaving `operations` empty and dropping every channel from the navigation — the document rendered blank. The original version is preserved on `x-original-aas-version`.
