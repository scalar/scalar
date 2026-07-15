---
'@scalar/astro': patch
'@scalar/asyncapi-upgrader': patch
'@scalar/client-side-rendering': patch
'@scalar/code-highlight': patch
'@scalar/components': patch
'@scalar/core': patch
'@scalar/docusaurus': patch
'@scalar/draggable': patch
'@scalar/express-api-reference': patch
'@scalar/fastify-api-reference': patch
'@scalar/galaxy': patch
'@scalar/helpers': patch
'@scalar/hono-api-reference': patch
'@scalar/icons': patch
'@scalar/import': patch
'@scalar/json-magic': patch
'@scalar/mock-server': patch
'@scalar/nestjs-api-reference': patch
'@scalar/nextjs-api-reference': patch
'@scalar/nextjs-openapi': patch
'@scalar/nuxt': patch
'@scalar/object-utils': patch
'@scalar/openapi-parser': patch
'@scalar/openapi-types': patch
'@scalar/openapi-upgrader': patch
'@scalar/postman-to-openapi': patch
'@scalar/react-renderer': patch
'@scalar/release-notes': patch
'@scalar/schemas': patch
'@scalar/snippetz': patch
'@scalar/sveltekit': patch
'@scalar/themes': patch
'@scalar/ts-to-openapi': patch
'@scalar/types': patch
'@scalar/use-codemirror': patch
'@scalar/use-hooks': patch
'@scalar/use-toasts': patch
'@scalar/validation': patch
'@scalar/void-server': patch
---

Republish so the updated README (with the Scalar platform overview) reaches npm. Also renames the README generator metadata in package.json from `readme` to `scalarReadme`: npm treats a `readme` field as the readme text itself, so affected packages were published with a literal `[object Object]` readme on the registry instead of README.md.
