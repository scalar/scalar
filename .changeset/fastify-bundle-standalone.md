---
'@scalar/fastify-api-reference': patch
---

Bundle the plugin with Vite and inline the standalone script at build time. The script used to be read from disk at runtime, which broke when the Fastify app was bundled (for example into a Docker image). The output is now self-contained and bundler-safe.
