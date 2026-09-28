---
"@scalar/workspace-store": patch
"@scalar/api-client": patch
---

Preserve configured OAuth redirect URLs when changing credentials or clearing tokens, and hide refresh controls when no refresh token is available.

Previously saved redirect overrides, including empty strings and prefilled page origins, remain unchanged because they cannot be distinguished from intentional user choices. Users affected by the earlier bug must enter the intended redirect URL again.

The public `@scalar/workspace-store` OAuth secrets types now expose `x-scalar-secret-redirect-uri` as optional (`string | undefined`). Consumers must handle an absent override separately from an explicit empty string.
