---
'@scalar/workspace-store': patch
'@scalar/helpers': patch
---

fix: forward selected forbidden headers via `X-Scalar-*` when proxying

Browsers strip selected forbidden headers from outgoing requests. When using the Scalar proxy (or running in Electron), we now rewrite a small allowlist (`Date`, `DNT`, and `Referer`) to `X-Scalar-*` headers so the proxy can forward the intended upstream headers without opening support for the full forbidden-header set.