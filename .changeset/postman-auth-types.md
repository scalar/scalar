---
'@scalar/postman-to-openapi': patch
---

Read the API key name and location from Postman apikey auth under distinct scheme names, accept the Postman v2.0 attribute object form, convert digest auth to an http digest scheme, and skip auth types OpenAPI cannot describe, such as awsv4, so the collection still converts and an operation overriding auth with one of them drops the inherited security.
