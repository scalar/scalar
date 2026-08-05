---
'@scalar/oas-utils': patch
'@scalar/api-client': patch
---

Expose `server` and `customFetch` in the ClientPlugin `beforeRequest` hook
payload (both optional, additive) so plugins can resolve relative URLs and run
network calls — e.g. a token refresh — through the host fetch without closing
over external state.
