---
'@scalar/api-client': minor
---

feat: show a request timing waterfall for proxied requests

Proxied requests now surface a **Timing** tab in the response view with a DNS lookup, initial connection, TLS handshake, and waiting-for-server-response breakdown. The Scalar proxy measures these network phases between the proxy and the target server and reports them via a `Server-Timing` header, since browsers do not expose per-phase timing for cross-origin requests. The tab only appears for requests sent through the proxy.
