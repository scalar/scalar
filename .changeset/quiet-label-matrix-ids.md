---
"@scalar/mock-server": patch
---

Strip the `label` and `matrix` prefixes from primitive path parameters before request validation, so `/users/.5` and `/users/;id=5` are accepted for an integer `id`.

Preserve percent-encoded delimiters in matrix primitive values so validation checks the complete string.
