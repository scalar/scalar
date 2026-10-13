---
'@scalar/openapi-upgrader': patch
---

The 3.0 to 3.1 upgrade no longer skips the `default` entry of a Responses Object, which it mistook for the `default` keyword, so schemas in a default response are upgraded too.
