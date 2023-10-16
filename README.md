# Scalar API Reference

[![CI](https://github.com/a-numbered-company/api-reference/actions/workflows/ci.yml/badge.svg)](https://github.com/a-numbered-company/api-reference/actions/workflows/ci.yml)
[![Release](https://github.com/a-numbered-company/api-reference/actions/workflows/release.yml/badge.svg)](https://github.com/a-numbered-company/api-reference/actions/workflows/release.yml)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

Generate interactive API documentations from Swagger files. [Try our Demo](https://docs.scalar.com/swagger-editor)

![github](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)

## Features

- Uses Swagger/OpenAPI spec files
- Request examples for a ton of languages + frameworks
- Has an integrated API client
- Edit your Swagger files with a live preview
- Doesn’t look like it’s 2011

## Table of Contents

- [Getting Started](#getting-started)
  - [From a CDN](#from-a-cdn)
  - [With Vue.js](#with-vuejs)
    - [isEditable?: boolean](#iseditable-boolean)
    - [spec?: string](#spec-string)
    - [specUrl?: string](#specurl-string)
    - [transformedSpec?: string](#transformedspec-string)
    - [proxyUrl?: string](#proxyurl-string)
    - [initialTabState?: string](#initialtabstate-string)
    - [showSidebar?: boolean](#showsidebar-boolean)
    - [footerBelowSidebar?: boolean](#footerbelowsidebar-boolean)
- [With React](#with-react)
- [Using our amazing service](#using-our-amazing-service)
- [Themes](#themes)
- [Advanced: Styling](#advanced-styling)
- [Community](#community)
- [Other packages](#other-packages)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### From a CDN

```html
<!DOCTYPE html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <!-- Add your own OpenAPI/Swagger spec file URL here: -->
    <script
      id="api-reference"
      data-url="https://example.com/swagger.json"></script>
    <script src="https://www.unpkg.com/@scalar/api-reference"></script>
  </body>
</html>
```

You can also use the following syntax to directly pass an OpenAPI spec:

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
  data-proxy-url="https://api.scalar.com/request-proxy">
  { … }
</script>
```

### With Vue.js

The API Reference is built in Vue.js. If you’re working in Vue.js, too, you can directly use our Vue components. Just install them:

```bash
npm install @scalar/api-reference
```

And import the `ApiReference` component to your app:

```vue
<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference />
</template>
```

You can [pass props to customize the API reference](https://github.com/scalar/scalar/tree/main/packages/api-reference).

## With React

The API Reference package is written in Vue. That shouldn’t stop you from using it in React, though. You can use [veaury](https://github.com/devilwjp/veaury) to load the `<APIReference />` component in React:

```ts
import { ApiReference as VueComponent } from '@scalar/api-reference'
import { applyVueInReact } from 'veaury'

const ApiReference = applyVueInReact(VueComponent)

function App() {
  return (
    <>
      <ApiReference isEditable={true} />
    </>
  )
}

export default App
```

## Using our amazing service

Wait, this is open source and you can do whatever you want. But if you want to add a nice, customizable guide, collaborate with your team and have everything served through a CDN, create an account on [scalar.com](https://scalar.com).

## Themes

You don’t like the color scheme? We’ve prepared some themes for you:

```vue
/* theme?: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized' */
<ApiReference theme="moon" />
```

ℹ️ The `default` theme is … the default theme. If you want to make sure no theme is applied, pass `none`.

## Advanced: Styling

Overwrite our CSS variables. We won’t judge.

```
:root {
  --theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
}
```

We’re using the `default-` prefix for our variables to not overwrite your variables. You can [use all variables without a prefix](https://github.com/scalar/api-reference/blob/main/packages/default-theme/src/theme.css).

```css
/* ✅ Good (without `default` prefix) */
--theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
/* ❌ Bad (with `default` prefix) */
--default-theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
```

## Community

We are API nerds. You too? Let’s chat on Discord: https://discord.com/invite/Ve683JXN

## Other packages

This repository contains all our open source projects and there’s definitely more to discover.

| Package                                                                                                    | Description                                           |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [@scalar/api-client](https://github.com/scalar/scalar/tree/main/packages/api-client)                       | the open source API testing client                    |
| [@scalar/api-client-proxy](https://github.com/scalar/scalar/tree/main/packages/api-client-proxy)           | an api request proxy based on express                 |
| [@scalar/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference)                 | generate beautiful API references                     |
| [@scalar/echo-server](https://github.com/scalar/scalar/tree/main/packages/echo-server)                     | an express server which replies with the request data |
| [@scalar/fastify-api-reference](https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference) | a fastify plugin to render API references             |
| [@scalar/swagger-editor](https://github.com/scalar/scalar/tree/main/packages/swagger-editor)               | an editor tailored to write OpenAPI spec              |
| [@scalar/swagger-parser](https://github.com/scalar/scalar/tree/main/packages/swagger-parser)               | parse OpenAPI specs                                   |
| [@scalar/use-clipboard](https://github.com/scalar/scalar/tree/main/packages/use-clipboard)                 | tiny Vue wrapper around the clipboard API             |
| [@scalar/use-codemirror](https://github.com/scalar/scalar/tree/main/packages/use-codemirror)               | CodeMirror for Vue                                    |
| [@scalar/use-keyboard-event](https://github.com/scalar/scalar/tree/main/packages/use-keyboard-event)       | keyboard shortcuts for Vue                            |
| [@scalar/use-toasts](https://github.com/scalar/scalar/tree/main/packages/use-toasts)                       | display toasts in Vue                                 |
| [@scalar/use-tooltip](https://github.com/scalar/scalar/tree/main/packages/use-tooltip)                     | tooltips in Vue                                       |

## Contributing

Contributions are welcome. We’re using [pnpm](https://pnpm.io/).

Install all dependencies:
`$ pnpm install`

Run the development server:
`$ pnpm run dev`

Build all packages:
`$ pnpm run build`

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/api-reference/blob/main/LICENSE).
