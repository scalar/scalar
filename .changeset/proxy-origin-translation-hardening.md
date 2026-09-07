---
---

Harden the private CORS proxy against cross-origin credential forwarding, including redirects that cannot replay their request bodies, and block the local NAT64 translation range. The proxy now follows only same-origin redirects. This deployment-only project is excluded from package versioning.
