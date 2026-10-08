---
'@scalar/workspace-store': patch
---

Match cookie paths with the RFC 6265 path-match algorithm so a cookie restricted to `/api` is not sent with requests to `/apiv2`.
