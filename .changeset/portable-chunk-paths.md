---
'@scalar/workspace-store': patch
---

Keep chunk filenames inside the output directory and match their references on Windows. Reject existing symlinks below the output root when writing chunks and the workspace manifest.
