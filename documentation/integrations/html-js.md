# API Reference with HTML/JS

To get started, you can use a simple HTML file. It's the easiest, and probably also the quickest way to get up and running, literally in seconds.

```html
<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>

  <body>
    <div id="app"></div>

    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the API Reference -->
    <script>
      Scalar.createApiReference('#app', {
        // The URL of the OpenAPI/Swagger document
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

This renders our `@scalar/galaxy` OpenAPI example, using the latest version of `@scalar/api-reference`.

## Configuration

Check out the [Configuration](../configuration.md) page to learn more about customizing your API reference.

## Content Security Policy (CSP)

If your page enforces a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), the inline initialization script is blocked unless you allow `unsafe-inline`.

To keep a strict `script-src` instead, generate a per-request nonce and put it on both script tags:

```html
<head>
  <!-- The reference also injects styles at runtime; this lets them carry the same nonce -->
  <meta property="csp-nonce" content="r4nd0m" />
</head>
<body>
  <div id="app"></div>

  <!-- script-src 'nonce-r4nd0m' — no unsafe-inline, no unsafe-eval -->
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" nonce="r4nd0m"></script>
  <script nonce="r4nd0m">
    Scalar.createApiReference('#app', {
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    })
  </script>
</body>
```

> [!NOTE]
> **`style-src` still needs `'unsafe-inline'`.** The reference renders inline `style="…"` attributes, and a CSP nonce can never authorize inline style attributes — only `<script>`, `<style>` and `<link>` elements. So a strict, nonce-only `style-src` is not possible today; keep `style-src 'unsafe-inline'`. The win here is `script-src`, which can stay fully strict.

If you render the HTML through one of our server integrations (Next.js, Express, Fastify, NestJS, Hono, SvelteKit, Astro), pass a `nonce` to the configuration and the script tags and meta tag are added for you.

## Version

It's recommended to use the latest version from jsdelivr. You'll get continuous updates, fixes and other improvements and that's also the one we're testing and monitoring continuously.

If you really want to stick to a specific version, that's possible, too. You can just add the version to the URL of the script:

```html
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.28.5"></script>
```

## JavaScript API

The HTML sample above showed how to integrate Scalar using automatic mounting and an ID selector. More information on the JavaScript API is provided below.

### Automatic Mounting

```typescript
Scalar.createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})
```

### Manual Mounting

```typescript
const app = Scalar.createApiReference({
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})

// Mounting
app.mount('#app')
```

By the way, you don't have to pass a string. You can pass a HTML element:

```typescript
const element = getElementById('app')

app.mount(element)
```

### Update the Configuration

```typescript
const app = Scalar.createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})

// Updating the configuration
app.updateConfiguration({
  url: 'https://petstore.swagger.io/v2/swagger.json',
})
```

### Unmount

```typescript
const app = Scalar.createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})

app.destroy()
```

### ESM

When using the package in (modern) ECMAScript environment, you can just import the `createApiReference` method from the
package.

Omit the `Scalar.` prefix then, that's only necessary when importing the JS from the jsdelivr CDN.

Here is an example:

```typescript
import { createApiReference } from '@scalar/api-reference'

createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})
```
