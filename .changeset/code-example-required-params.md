---
'@scalar/blocks': patch
---

Only show required parameters in code examples. Optional query, header, and cookie parameters are now omitted from the generated request snippets unless they are explicitly enabled via the `x-disabled: false` extension.
