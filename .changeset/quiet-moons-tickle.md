---
'@scalar/workspace-store': patch
---

chore: measure the remaining document load steps when `verbose` is enabled

`createWorkspaceStore({ verbose: true })` now also reports timings for the
validation, navigation and proxy-creation steps, and reports the deep clone
that feeds coercion separately from the coercion itself. Previously these
steps were untimed, so a large part of `addDocument` was unaccounted for.
