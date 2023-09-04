# Scalar API Reference

[![CI](https://github.com/a-numbered-company/api-reference/actions/workflows/ci.yml/badge.svg)](https://github.com/a-numbered-company/api-reference/actions/workflows/ci.yml)
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

### With Vue.js

```bash
npm install @scalar/api-reference
```

```vue
<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference />
</template>
```

You pass props to configure the API reference:

```vue
<ApiReference :is-editable="true" :show-sidebar="false" />
```

## Using the CLI

TBD 👀

## Using our amazing service

Wait, this is open source and you can do whatever you want. But if you want to add a nice, customizable guide, collaborate with your team and have everything served through a CDN, visit us on [scalar.com](https://scalar.com).

## Advanced: Styling

Use our default style and you’re done.

```js
import '@scalar/api-reference/style.css'
```

Or: Overwrite our CSS variables. We won’t judge.

```
:root {
  --theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
}
```

## Community

We’re API nerds. You too? Let’s chat on Discord: https://discord.gg/mw6FQRPh

## Other packages

This repository contains all our open source projects and there’s definitely more to discover.

```
.
├── packages
│   ├── api-client (@scalar/api-client)
│   ├── api-client-proxy (@scalar/api-client-proxy)
│   ├── api-reference (@scalar/api-reference)
│   ├── cli (@scalar/cli)
│   ├── fastify-api-reference (@scalar/fastify-api-reference)
│   ├── echo-server (@scalar/echo-server)
│   ├── swagger-editor (@scalar/swagger-editor)
│   ├── swagger-parser (@scalar/swagger-parser)
│   ├── use-clipboard (@scalar/use-clipboard)
│   ├── use-codemirror (@scalar/use-codemirror)
│   ├── use-keyboard-event (@scalar/use-keyboard-event)
│   └── use-tooltip (@scalar/use-tooltip)
└── projects
    └── api-client-web (web app)
```

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
