---
'@scalar/validation': patch
---

Remember finished results in `validate`, so a recursive union where no branch matches no longer takes exponential time. `validate` also no longer overflows the stack when a schema loops back to itself on a value that is not an object or array (for example `lazy(() => union([self, string()]))` on `7`). It now returns `true` or `false`, based on the branches that do not loop.
