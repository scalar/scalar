# API Reference with HTML/JS

To get started, load the ESM build from our CDN in a simple HTML file. No package installation or build step is required.

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

    <script type="module">
      import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'

      createApiReference('#app', {
        // The URL of the OpenAPI document
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
        // Avoid CORS issues
        proxyUrl: 'https://proxy.scalar.com',
      })
    </script>
  </body>
</html>
```

This renders our `@scalar/galaxy` OpenAPI example, using the latest version of `@scalar/api-reference`. We recommend the ESM build for new integrations: it loads features such as the API client on demand. Styles are included automatically.

Use `type="module"` and import `createApiReference` from the `/esm.js` URL. Keep initialization inside the same module script, where the imported function is available.

## Configuration

Check out the [Configuration](../configuration.md) page to learn more about customizing your API reference.

## Content Security Policy (CSP)

If your page enforces a strict [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), the inline initialization script needs a nonce or a hash unless you allow `unsafe-inline`.

To authorize the inline module without `unsafe-inline`, generate a per-request nonce and put it on the module script. Allow `https://cdn.jsdelivr.net` in `script-src` so the browser can load the imported module and its chunks:

```html
<head>
  <!-- The reference also injects styles at runtime; this lets them carry the same nonce -->
  <meta property="csp-nonce" content="r4nd0m" />
</head>
<body>
  <div id="app"></div>

  <!-- script-src 'nonce-r4nd0m' https://cdn.jsdelivr.net — no unsafe-inline, no unsafe-eval -->
  <script type="module" nonce="r4nd0m">
    import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'

    createApiReference('#app', {
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
<script type="module">
  import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.69.2/esm.js'

  createApiReference('#app', {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  })
</script>
```

## JavaScript API

The HTML sample above showed how to integrate Scalar using automatic mounting and an ID selector. The following examples use `createApiReference` imported in that module script.

### Automatic Mounting

```typescript
createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})
```

### Manual Mounting

```typescript
const app = createApiReference({
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})

// Mounting
app.mount('#app')
```

By the way, you don't have to pass a string. You can pass a HTML element:

```typescript
const element = document.getElementById('app')

app.mount(element)
```

### Update the Configuration

```typescript
const app = createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})

// Updating the configuration
app.updateConfiguration({
  url: 'https://petstore.swagger.io/v2/swagger.json',
})
```

### Unmount

```typescript
const app = createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})

app.destroy()
```

### Using a Bundler

If your project uses a bundler, install `@scalar/api-reference` and import `createApiReference` from the package instead of the CDN URL:

```typescript
import { createApiReference } from '@scalar/api-reference'

createApiReference('#app', {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
})
```

## Classic Script

You can also use a classic script tag. This build exposes `Scalar.createApiReference` as a global and remains supported:

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
  Scalar.createApiReference('#app', {
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    proxyUrl: 'https://proxy.scalar.com',
  })
</script>
```
