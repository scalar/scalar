---
'@scalar/workspace-store': patch
---

Stop walking every path through shared schemas when collecting a parameter's declared example values. A shared schema found to declare no values is now skipped on the other paths that reach it, so a request whose parameter points into a deep graph of shared schemas no longer takes seconds to minutes to render.
