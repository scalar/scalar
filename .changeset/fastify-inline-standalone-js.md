---
'@scalar/fastify-api-reference': patch
---

Fixed the Fastify integration crashing with "JavaScript file not found" in bundled production builds (Docker, esbuild, bun). The API Reference JavaScript is now inlined at build time, so it survives downstream bundling.
