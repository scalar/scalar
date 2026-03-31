---
"@scalar/code-highlight": patch
"@scalar/ts-to-openapi": patch
"@scalar/use-toasts": patch
"@scalar/fastify-api-reference": patch
---

chore: pin all dependencies to exact versions for supply chain security

Pin all dependencies to exact versions (removing ^ and ~ ranges) to protect against supply chain attacks. This includes:
- Updated unified to 11.0.5 in @scalar/code-highlight
- Updated TypeScript to 5.8.3 in @scalar/ts-to-openapi  
- Updated vue-sonner to 1.1.2 in @scalar/use-toasts
- Kept Fastify at 4.x in fastify integration (not compatible with 5.x yet)
