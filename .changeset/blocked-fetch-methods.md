---
'@scalar/api-client': patch
'@scalar/types': patch
---

Show a clear error when a request uses a Fetch-forbidden method (CONNECT, TRACE, or TRACK), including methods changed by pre-request scripts, instead of throwing while building the request.
