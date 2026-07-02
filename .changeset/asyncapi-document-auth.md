---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
---

Render document-wide authentication for AsyncAPI documents. The introduction now shows the same Authentication selector used for OpenAPI, populated from `components.securitySchemes`, with requirements derived from the union of every server's `security` (AsyncAPI has no root-level `security`). Schemes shared with OpenAPI (`http`, `oauth2`, `openIdConnect`, `apiKey`) get full input UI; broker-specific types still appear in the selector but have no dedicated input yet. Operation/channel-level auth is intentionally left for a follow-up.
