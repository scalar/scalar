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

When you pass a `nonce`, the rendered HTML stamps it onto the inline `<script>` and the CDN `<script>` tag (and Scalar's own `<style>` tags, plus a matching `<meta property="csp-nonce">`). This lets the API Reference run under a strict `script-src` with no `unsafe-inline` and no `unsafe-eval`.

```ts
ApiReference({
  url: '/openapi.json',
  // Match this value in your `script-src` CSP directive.
  nonce: 'r4nd0m',
})
```

Note: `style-src` still needs `'unsafe-inline'`. The reference renders inline `style="…"` attributes, which a CSP nonce can never authorize (nonces only apply to `<script>`, `<style>` and `<link>` elements), so a nonce-only `style-src` is not possible. The win is a fully strict `script-src`.
