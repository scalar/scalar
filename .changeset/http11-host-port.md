---
'@scalar/snippetz': patch
---

Keep the port in the `Host` header of HTTP/1.1 snippets. A request to `http://localhost:8080/api` now shows `Host: localhost:8080` instead of `Host: localhost`.
