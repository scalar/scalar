---
"@scalar/openapi-validator": patch
---

Report duplicate operation IDs in active paths, webhooks and callbacks, including local references.

Reusing a callback or Path Item component in multiple locations now reports duplicate operation IDs when the component's operations declare an `operationId`. Each reference is checked as a separate occurrence in the API. Give those operations unique IDs at each location, or omit their optional `operationId` fields when sharing the component.
