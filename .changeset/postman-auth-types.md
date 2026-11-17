---
'@scalar/postman-to-openapi': patch
---

Skip Postman auth types that OpenAPI cannot describe, such as AWS Signature, OAuth 1.0 and Hawk, instead of failing the whole conversion, convert digest auth to an HTTP digest scheme, and read the API key name and location from apikey auth, naming every key other than the default `api_key` header after its location and name so different keys no longer overwrite each other.
