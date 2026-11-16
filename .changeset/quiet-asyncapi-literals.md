---
'@scalar/workspace-store': patch
'@scalar/json-magic': patch
---

Preserve literal $ref values in AsyncAPI examples, schema values, and extensions during initial loading and lazy resolution without fetching them. Continue resolving references inside Multi Format Schema Objects. Index authored document keys without following virtual proxy links.
