---
'@scalar/workspace-store': patch
---

Resolve local references when the server store inspects a document. Navigation and externalization both read through `getResolvedRef`, which needs the `$ref-value` the magic proxy provides — without it a `$ref`'d path item read as a bare `{ $ref }`, so its operations reached neither the sidebar nor the chunks and vanished from the rendered document with no error. This also covers split-file documents, where bundling rewrites an external reference into a local pointer into `x-ext` rather than inlining it: that bucket is not modelled by the OpenAPI schema, so coercion was dropping it and leaving every rewritten reference dangling. Resolution stays lazy, local and synchronous, and resolved values are unwrapped before anything is stored, so the served document and its chunks keep their original `$ref`s.
