---
'@scalar/fastify-api-reference': patch
---

Declare support for Fastify v4, v5, and v6 via the plugin's `fastify` version range, so Fastify validates compatibility at registration and fails fast on an unsupported host. The test suite now runs against Fastify v5, and the plugin was verified against the Fastify v6 pre-release (it behaves identically). The runtime stays compatible with Fastify v4. Also lowers the minimum Node.js version to 20 to match Fastify v5.
