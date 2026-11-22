---
"@scalar/mock-server": patch
---

Strip the `label` and `matrix` prefixes from primitive path parameters before request validation, so `/users/.5` and `/users/;id=5` are accepted for an integer `id`.
