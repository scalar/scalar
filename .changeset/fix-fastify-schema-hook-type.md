---
"@scalar/fastify-api-reference": patch
---

Fix intermittent TypeScript error when hook handlers are spread into route options. Annotating the internal `schemaToHideRoute` constant as `FastifySchema` prevents TypeScript from narrowing its type to `{ hide: boolean }`, which caused incompatible hook-handler types with Fastify 5's `NoInfer<SchemaCompiler>`-based route definitions.
