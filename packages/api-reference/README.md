# Scalar API Reference

[![Version](https://img.shields.io/npm/v/%40scalar/api-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Hits on jsdelivr](https://img.shields.io/jsdelivr/npm/hm/%40scalar%2Fapi-reference)](https://www.jsdelivr.com/package/npm/@scalar/api-reference)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference)](https://www.npmjs.com/package/@scalar/api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Generate interactive API documentations from Swagger files. [Try our Demo](https://docs.scalar.com/swagger-editor)

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

## Installation

```bash
npm install @scalar/api-reference
```

## Usage

```vue
<script setup>
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<template>
  <ApiReference />
</template>
```

### CDN

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
    <!-- Need a Custom Header? Check out this example: https://codepen.io/scalarorg/pen/VwOXqam -->
    <!-- Note: We’re using our public proxy to avoid CORS issues. You can remove the `data-proxy-url` attribute if you don’t need it. -->
    <script
      id="api-reference"
      data-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml"
      data-proxy-url="https://proxy.scalar.com"></script>

    <!-- Optional: You can set a full configuration object like this: -->
    <script>
      var configuration = {
        theme: 'purple',
      }

      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    </script>

    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

You can also use the following syntax to directly pass an OpenAPI specification:

```html
<script
  id="api-reference"
  type="application/json">
  { … }
</script>
```

If you’d like to add a request proxy for the API client (to avoid CORS issues):

```html
<script
  id="api-reference"
  type="application/json"
  data-proxy-url="https://proxy.scalar.com">
  { … }
</script>
```

#### Events [beta]

We have recently added two events to the standalone CDN build only.

##### scalar:reload-references

Reload the references, this will re-mount the app in case you have switched pages or the dom
elements have been removed.

```ts
document.dispatchEvent(new Event('scalar:reload-references'))
```

##### scalar:update-references-config

If you have updated the config or spec, you can trigger this event with the new payload to update
the app. It should update reactively so you do not need to trigger the reload event above after.

```ts
import { type ReferenceProps } from './types'

const ev = new CustomEvent('scalar:update-references-config', {
  detail: {
    configuration: {
      spec: {
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      },
    },
  } satisfies ReferenceProps,
})
document.dispatchEvent(ev)
```

## Vue.js

The API Reference is built in Vue.js. If you’re working in Vue.js, too, you can directly use our Vue components.
Install them via `npm`:

```bash
npm install @scalar/api-reference
```

And import the `ApiReference` component and style to your app:

```vue
<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
</script>

<template>
  <ApiReference
    :configuration="{
      spec: {
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
      },
    }" />
</template>
```

You can [pass props to customize the API reference](https://github.com/scalar/scalar/tree/main/documentation/configuration.md).

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
