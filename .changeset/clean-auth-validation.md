---
"@scalar/api-client": patch
---

Replace the direct TypeBox dependency with `@scalar/validation` for OpenID Connect discovery and OAuth2 metadata parsing.

Remove invalid and empty entries from supported grant types in discovery and metadata responses.
