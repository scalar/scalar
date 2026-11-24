---
"@scalar/mock-server": patch
---

Validate and parse request bodies sent with structured `+json` media types such as `application/vnd.api+json` and `application/merge-patch+json`, so they are checked against the schema and reach `x-handler` as `req.body`.
