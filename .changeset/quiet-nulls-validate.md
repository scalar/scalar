---
'@scalar/mock-server': patch
'@scalar/openapi-upgrader': patch
---

Finish migrating legacy `nullable` schema keywords when upgrading OpenAPI 3.0 descriptions, so downstream request validators can compile the upgraded schemas and enforce the rest of the request contract.
