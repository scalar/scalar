---
'@scalar/schemas': patch
---

Declare `@scalar/types` as a dependency, since the API reference configuration schema imports it at runtime and installs without hoisting failed to resolve it.
