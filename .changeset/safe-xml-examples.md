---
"@scalar/openapi-upgrader": patch
---

Only migrate XML metadata in schemas when upgrading to OpenAPI 3.2. Preserve example payloads and other data containing xml properties instead of changing them or throwing errors.
