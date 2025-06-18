# Scalar API Reference with HTML/JS

To get started, you can use a simple HTML file. It’s the easiest, and probably also the quickest way to get up and running, literally in seconds.

```html
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>

  <body>
    <div id="app"></div>

    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the Scalar API Reference -->
    <script>
      Scalar.createApiReference('#app', {
        // The URL of the OpenAPI/Swagger document
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
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

## Version

It’s recommended to use the latest version from jsdelivr. You’ll get continuous updates, fixes and other improvements and that’s also the one we’re testing and monitoring continuously.

If you really want to stick to a specific version, that’s possible, too. You can just add the version to the URL of the script:

```html
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.28.5"></script>
```

## JavaScript API

The HTML sample above showed how to integrate Scalar using automatic mounting and an ID selector. More information on the JavaScript API is provided below.

### Automatic Mounting

```ts
Scalar.createApiReference('#app', {
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})
```

### Manual Mounting

```ts
const app = Scalar.createApiReference({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

// Mounting
app.mount('#app')
```

By the way, you don’t have to pass a string. You can pass a HTML element:

```ts
const element = getElementById('app')

app.mount(element)
```

### Update the Configuration

```ts
const app = Scalar.createApiReference('#app', {
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

// Updating the configuration
app.updateConfiguration({
  url: 'https://petstore.swagger.io/v2/swagger.json',
})
```

### Unmount

```ts
const app = Scalar.createApiReference('#app', {
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

app.destroy()
```

### ESM

When using the package in (modern) ECMAScript environment, you can just import the `createApiReference` method from the
package.

Omit the `Scalar.` prefix then, that’s only necessary when importing the JS from the jsdelivr CDN.

Here is an example:

```ts
import { createApiReference } from '@scalar/api-reference'

createApiReference('#app', {
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})
```
