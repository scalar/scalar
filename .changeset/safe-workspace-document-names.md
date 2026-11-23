---
"@scalar/helpers": patch
"@scalar/workspace-store": patch
---

Guard document, history, and authentication lookups against inherited properties while preserving valid workspace document names such as `constructor` and `prototype`. Ignore reserved keys when loading workspace snapshots and copying workspace metadata.
