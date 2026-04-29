---
'@scalar/workspace-store': patch
'@scalar/helpers': patch
---

fix: forward `Date` request header via `X-Scalar-Date` when proxying

Browsers strip the `Date` header from outgoing requests because it is a forbidden header in the Fetch spec. When using the Scalar proxy (or running in Electron), we now rewrite a user-provided `Date` header as `X-Scalar-Date` so the proxy can forward it as the actual `Date` header on the upstream request, mirroring the existing `X-Scalar-Cookie` behavior.