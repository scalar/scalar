---
'@scalar/client-side-rendering': minor
'@scalar/api-reference': minor
'@scalar/types': minor
'@scalar/schemas': minor
'@scalar/nextjs-api-reference': minor
'@scalar/express-api-reference': minor
'@scalar/fastify-api-reference': minor
'@scalar/nestjs-api-reference': minor
'@scalar/hono-api-reference': minor
'@scalar/sveltekit': minor
'@scalar/astro': minor
---

Add a `nonce` option for Content Security Policy support.

When you pass a `nonce`, the rendered HTML stamps it onto the inline `<script>` and `<style>` tags (and the CDN `<script>` tag), and emits a matching `<meta property="csp-nonce">` tag so the standalone bundle applies the same nonce to the stylesheet it injects at runtime. This lets the API Reference render under a strict Content Security Policy without `unsafe-inline`.

```ts
ApiReference({
  url: '/openapi.json',
  // Match this value in your `script-src` and `style-src` CSP directives.
  nonce: 'r4nd0m',
})
```
