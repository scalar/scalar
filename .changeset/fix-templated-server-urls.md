---
'@scalar/workspace-store': patch
'@scalar/blocks': patch
'@scalar/api-reference': patch
---

Resolve literal and templated relative OpenAPI server URLs against the configured base server URL or the API description's HTTP(S) location. With either base, `api.example.com/v1`, `api.example.com:8080/v1`, and `myhost:8080/v1` resolve as paths, including when produced by server variables. Use an explicit URL such as `https://api.example.com:8080/v1` or `//api.example.com:8080/v1` to target that host.

Use path-item servers in Try It and code samples, including selections and server variable edits made in Try It.
