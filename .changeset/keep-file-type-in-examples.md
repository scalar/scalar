---
'@scalar/openapi-upgrader': patch
---

Keep `type: file` inside Swagger 2.0 example data when upgrading to OpenAPI 3.0. Continue converting file schemas in reusable responses and parameters named like data keywords. Preserve example and default data on schemas and reusable parameters whose names match schema-map keywords. Continue upgrading response headers whose names match data keywords. Limit Swagger-specific data guards to the 2.0 upgrade so OpenAPI 3.0 request bodies and callbacks named `x-example` still upgrade. Preserve example payloads on reusable objects named `headers`.
