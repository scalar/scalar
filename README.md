# Scalar API Reference

[![CI](https://github.com/a-numbered-company/api-reference/actions/workflows/ci.yml/badge.svg)](https://github.com/a-numbered-company/api-reference/actions/workflows/ci.yml)
[![Release](https://github.com/a-numbered-company/api-reference/actions/workflows/release.yml/badge.svg)](https://github.com/a-numbered-company/api-reference/actions/workflows/release.yml)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/mw6FQRPh)

Generate interactive API documentations from Swagger files

## Features

- Uses Swagger/OpenAPI spec files
- Request examples for a ton of languages + frameworks
- Has an integrated API client
- Edit your Swagger files with a live preview
- Doesn’t look like it’s 2011

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
  </head>
  <body>
    <!-- Add your own OpenAPI/Swagger spec file URL here: -->
    <div data-spec-url="https://example.com/swagger.json" />
    <script src="https://cdn.scalar.com/api-reference.standalone.js"></script>
  </body>
</html>
```

You can also use the following syntax to directly pass an OpenAPI spec:

```html
<div data-spec="{ … }" />
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

You can pass props to customize the API reference:

#### isEditable?: boolean

Whether the Swagger editor should be shown.

```vue
<ApiReference :isEditable="true" />
```

#### showSidebar?: boolean

Whether the sidebar should be shown.

```vue
<ApiReference :showSidebar="true" />
```

#### footerBelowSidebar?: boolean

Whether the footer should below the content or below the content _and_ the sidebar.

```vue
<ApiReference :footerBelowSidebar="true" />
```

#### spec?: string

Directly pass an OpenAPI/Swagger spec.

```vue
<ApiReference :spec="{ … }" />
```

#### specUrl?: string

Pass the URL of a spec file (JSON or Yaml).

```vue
<ApiReference specUrl="/swagger.json" />
```

## Using the CLI

TBD 👀

## Using our amazing service

Wait, this is open source and you can do whatever you want. But if you want to add a nice, customizable guide, collaborate with your team and have everything served through a CDN, visit us on [scalar.com](https://scalar.com).

## Advanced: Styling

Overwrite our CSS variables. We won’t judge.

```
:root {
  --theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
}
```

You can [see all variables here](https://github.com/scalar/api-reference/blob/main/packages/default-theme/src/theme.css).

## Community

We are API nerds. You too? Let’s chat on Discord: https://discord.gg/mw6FQRPh

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
