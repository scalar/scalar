---
'@scalar/workspace-store': patch
---

Keep the navigation header inline in a compact document, so `x-scalar-navigation.name`, `title` and the other fields stay readable by plain property access and auth, history and the client modal keep working. Only the children travel in the navigation chunk, and `resolve(['x-scalar-navigation'])` loads them onto the document in place. This replaces the 0.64.0 compact wire form, which sent the whole navigation as a chunk reference.
