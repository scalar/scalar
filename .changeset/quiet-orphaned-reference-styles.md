---
'@scalar/api-reference': patch
---

Expose `Scalar.releaseUnusedStyles()` in the standalone bundle to release orphaned CSS without mounting a temporary reference or changing body theme classes. Preserve styles owned by active references and restore detached styles on the next mount.
