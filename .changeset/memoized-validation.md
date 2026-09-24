---
'@scalar/validation': patch
---

Remember finished results in `validate`, so a recursive union where no branch matches no longer takes exponential time. `validate` also no longer overflows the stack on a schema that points back at itself on a primitive (for example `lazy(() => union([self, string()]))`): it returns `true` or `false` as the other branches decide.
