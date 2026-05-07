---
'@scalar/api-reference': patch
'@scalar/workspace-store': patch
---

fix(api-reference): preserve OAuth redirect URI when switching OpenAPI documents

When using multiple OpenAPI documents with OAuth configured via `oauth2RedirectUri`,
switching to another document no longer clears the Redirect URL in the Authentication
section.

The fix threads `oauth2RedirectUri` from the top-level configuration into the security
scheme merge chain so that each newly loaded document's OAuth flows are pre-populated
with the configured redirect URI, rather than relying solely on a component-level watcher
that would skip re-population when the same OAuth flow identity was detected across
documents.
