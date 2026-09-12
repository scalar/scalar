---
'@scalar/api-client': minor
'@scalar/api-reference': minor
'@scalar/oas-utils': minor
'@scalar/types': minor
'@scalar/schemas': minor
'@scalar/pre-post-request-scripts': patch
---

Allow response hooks to return a replacement Response before the client processes its body, status, and headers. Add the onResponseReceived configuration callback for API References. Existing hooks can still read responses and return nothing.
