---
'@scalar/api-reference': minor
'@scalar/oas-utils': minor
'@scalar/api-client': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat: add `requestReady` client plugin hook and `onRequestReady` configuration callback that receive the exact fetch `Request` that is sent over the wire

The hook runs after the request has been built, right before it is sent. Header mutations apply to the outgoing request and the body bytes match what the server receives, which makes request signing possible: hashing the body of a rebuilt `multipart/form-data` request would produce a different multipart boundary than the request that is actually sent.
