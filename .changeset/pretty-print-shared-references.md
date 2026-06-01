---
'@scalar/helpers': patch
---

fix: prevent the browser from freezing when pretty-printing deeply shared object graphs (e.g. the "Show Schema" toggle on recursive OpenAPI schemas). `prettyPrintJson` now always collapses repeated references instead of fully expanding every shared subtree, which previously grew exponentially.
