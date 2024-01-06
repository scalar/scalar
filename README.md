# Scalar API Reference

[![CI](https://github.com/scalar/scalar/actions/workflows/ci.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/ci.yml)
[![Release](https://github.com/scalar/scalar/actions/workflows/release.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/release.yml)
[![Contributors](https://img.shields.io/github/contributors/scalar/scalar)](https://github.com/scalar/scalar/graphs/contributors)
[![GitHub License](https://img.shields.io/github/license/scalar/scalar)](https://github.com/scalar/scalar/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

Generate interactive API documentations from Swagger files. [Try our Demo](https://docs.scalar.com/swagger-editor)

[![Screenshot of an API Reference](https://github.com/scalar/scalar/assets/6201407/d8beb5e1-bf64-4589-8cb0-992ba79215a8)](https://docs.scalar.com/swagger-editor)

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
  - [With React](#with-react)
  - [With Fastify](#with-fastify)
  - [With Hono](#with-hono)
  - [With Express](#with-express)
  - [With NestJS](#with-nestjs)
- [Hosted API Reference](#hosted-api-reference)
- [Configuration](#configuration)
- [Themes](#themes)
- [Advanced: Styling](#advanced-styling)
- [Community](#community)
- [Other packages](#other-packages)
- [Contributing](#contributors)
- [License](#license)

## Getting Started

### From a CDN

```html
<!doctype html>
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
    <!-- Note: this includes our proxy, you can remove the following line if you do not need it -->
    <!-- data-proxy-url="https://api.scalar.com/request-proxy" -->
    <script
      id="api-reference"
      data-url="https://example.com/swagger.json"
      data-proxy-url="https://api.scalar.com/request-proxy"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
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

### With React

The API Reference package is written in Vue. That shouldn’t stop you from using it in React, though. You can use [veaury](https://github.com/devilwjp/veaury) to load the `<APIReference />` component in React:

```ts
import { ApiReference as VueComponent } from '@scalar/api-reference'
import { applyVueInReact } from 'veaury'

const ApiReference = applyVueInReact(VueComponent)

function App() {
  return (
    <>
      <ApiReference configuration={{ isEditable: true }} />
    </>
  )
}

export default App
```

### With Fastify

Our fastify plugin makes it so easy to render a reference, there’s no excuse to not have a documentation for your API.

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
  configuration: {
    spec: () => fastify.swagger(),
  },
})
```

Actually, it’s executing the `fastify.swagger()` call by default (if available). So that’s all you need to add:

```ts
await fastify.register(require('@scalar/fastify-api-reference'), {
  routePrefix: '/reference',
})
```

Read more: [@scalar/fastify-api-reference](https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference)

### With Hono

Our Hono middleware makes it so easy to render a reference:

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.get(
  '/reference',
  apiReference({
    spec: {
      url: '/swagger.json',
    },
  }),
)
```

Read more: [@scalar/hono-api-reference](https://github.com/scalar/scalar/tree/main/packages/hono-api-reference)

### With Express

Our Express middleware makes it so easy to render a reference:

```ts
import { apiReference } from '@scalar/express-api-reference'

app.use(
  '/reference',
  apiReference({
    spec: {
      content: OpenApiSpecification,
    },
  }),
)
```

Read more: [@scalar/express-api-reference](https://github.com/scalar/scalar/tree/main/packages/express-api-reference)

### With NestJS

Our NestJS middleware makes it so easy to render a reference:

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    spec: {
      url: '/swagger.json',
    },
  }),
)
```

Read more: [@scalar/nestjs-api-reference](https://github.com/scalar/scalar/tree/main/packages/nestjs-api-reference)

## Hosted API Reference

Wait, this is open source and you can do whatever you want. But if you want to add a nice, customizable guide, collaborate with your team and have everything served through a CDN, create an account on [scalar.com](https://scalar.com).

## Configuration

To customize the behavior of the API Reference, you can use the following configuration options:

- `isEditable`: Whether the Swagger editor should be shown.
- `spec.content`: Directly pass an OpenAPI/Swagger spec.
- `spec.url`: Pass the URL of a spec file (JSON or YAML).
- `spec.preparsedContent`: Preprocess specs with `@scalar/swagger-parser` and directly pass the result.
- `proxyUrl`: Use a proxy to send requests to other origins.
- `showSidebar`: Whether the sidebar should be shown.
- `customCss`: Pass custom CSS directly to the component.
- `searchHotKey`: Key used with CNTRL/CMD to open the search modal.
- `metaData`: Configure meta information for the page.
- `onSpecUpdate`: Listen to spec changes with a callback function.

For detailed information on how to use these options, refer to the [Configuration Section](https://github.com/scalar/scalar/blob/main/packages/api-reference/README.md/#configuration).

## Themes

You don’t like the color scheme? We’ve prepared some themes for you:

```vue
/* theme?: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized' */
<ApiReference :configuration="{ theme: 'moon' }" />
```

ℹ️ The `default` theme is … the default theme. If you want to make sure no theme is applied, pass `none`.

## Advanced: Styling

Overwrite our CSS variables. We won’t judge.

```
:root {
  --theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
}
```

We’re using the `default-` prefix for our variables to not overwrite your variables. You can [use all variables without a prefix](https://github.com/scalar/scalar/blob/main/packages/themes/src/base.css).

```css
/* ✅ Good (without `default` prefix) */
--theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
/* ❌ Bad (with `default` prefix) */
--default-theme-font: 'Comic Sans MS', 'Comic Sans', cursive;
```

Overwrite our night mode and day mode variables to build your own themes. Here are some of the basic variables to get you started:

![basic-scalar-variables](https://github.com/scalar/scalar/assets/6201407/63524321-66d2-44d0-8509-3db7e045a315)

```
.light-mode {
  --theme-color-1: #121212;
  --theme-color-2: rgba(0, 0, 0, 0.6);
  --theme-color-3: rgba(0, 0, 0, 0.4);
  --theme-color-accent: #0a85d1;
  --theme-background-1: #fff;
  --theme-background-2: #f6f5f4;
  --theme-background-3: #f1ede9;
  --theme-background-accent: #5369d20f;
  --theme-border-color: rgba(0, 0, 0, 0.08);
}
.dark-mode {
  --theme-color-1: rgba(255, 255, 255, 0.81);
  --theme-color-2: rgba(255, 255, 255, 0.443);
  --theme-color-3: rgba(255, 255, 255, 0.282);
  --theme-color-accent: #8ab4f8;
  --theme-background-1: #202020;
  --theme-background-2: #272727;
  --theme-background-3: #333333;
  --theme-background-accent: #8ab4f81f;
}
```

Or get more advanced by styling our sidebar!

![scalar-sidebar-variables](https://github.com/scalar/scalar/assets/6201407/2c363cbc-f06f-4ad3-b44f-05cee8c95a8b)

```
.light-mode .sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: currentColor;
  --sidebar-item-hover-background: var(--theme-background-2);
  --sidebar-item-active-background: var(--theme-background-2);
  --sidebar-border-color: var(--theme-border-color);
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-2);
  --sidebar-search-background: var(--theme-background-2);
  --sidebar-search-border-color: var(--theme-border-color);
  --sidebar-search--color: var(--theme-color-3);
}
.dark-mode .sidebar {
  --sidebar-background-1: var(--theme-background-1);
  --sidebar-item-hover-color: currentColor;
  --sidebar-item-hover-background: var(--theme-background-2);
  --sidebar-item-active-background: var(--theme-background-2);
  --sidebar-border-color: var(--theme-border-color);
  --sidebar-color-1: var(--theme-color-1);
  --sidebar-color-2: var(--theme-color-2);
  --sidebar-color-active: var(--theme-color-2);
  --sidebar-search-background: var(--theme-background-2);
  --sidebar-search-border-color: var(--theme-border-color);
  --sidebar-search--color: var(--theme-color-3);
}
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/8HeZcRGPFS>

## Other packages

This repository contains all our open source projects and there’s definitely more to discover.

| Package                                                                                                    | Description                                           |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [@scalar/api-client-proxy](https://github.com/scalar/scalar/tree/main/packages/api-client-proxy)           | an API request proxy based on express                 |
| [@scalar/api-client](https://github.com/scalar/scalar/tree/main/packages/api-client)                       | the open source API testing client                    |
| [@scalar/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference)                 | generate beautiful API references                     |
| [@scalar/echo-server](https://github.com/scalar/scalar/tree/main/packages/echo-server)                     | an express server which replies with the request data |
| [@scalar/fastify-api-reference](https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference) | a fastify plugin to render API references             |
| [@scalar/hono-api-reference](https://github.com/scalar/scalar/tree/main/packages/hono-api-reference)       | a Hono middleware to render API references            |
| [@scalar/nestjs-api-reference](https://github.com/scalar/scalar/tree/main/packages/nestjs-api-reference)   | a NestJS middleware to render API references          |
| [@scalar/swagger-editor](https://github.com/scalar/scalar/tree/main/packages/swagger-editor)               | an editor tailored to write OpenAPI spec              |
| [@scalar/swagger-parser](https://github.com/scalar/scalar/tree/main/packages/swagger-parser)               | parse OpenAPI specs                                   |
| [@scalar/use-clipboard](https://github.com/scalar/scalar/tree/main/packages/use-clipboard)                 | tiny Vue wrapper around the clipboard API             |
| [@scalar/use-codemirror](https://github.com/scalar/scalar/tree/main/packages/use-codemirror)               | CodeMirror for Vue                                    |
| [@scalar/use-keyboard-event](https://github.com/scalar/scalar/tree/main/packages/use-keyboard-event)       | keyboard shortcuts for Vue                            |
| [@scalar/use-toasts](https://github.com/scalar/scalar/tree/main/packages/use-toasts)                       | display toasts in Vue                                 |
| [@scalar/use-tooltip](https://github.com/scalar/scalar/tree/main/packages/use-tooltip)                     | tooltips in Vue                                       |

## Contributors

<!-- readme: collaborators,contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/hanspagel">
            <img src="https://avatars.githubusercontent.com/u/1577992?v=4" width="100;" alt="hanspagel"/>
            <br />
            <sub><b>hanspagel</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/tmastrom">
            <img src="https://avatars.githubusercontent.com/u/36525329?v=4" width="100;" alt="tmastrom"/>
            <br />
            <sub><b>tmastrom</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/marclave">
            <img src="https://avatars.githubusercontent.com/u/6176314?v=4" width="100;" alt="marclave"/>
            <br />
            <sub><b>marclave</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/hwkr">
            <img src="https://avatars.githubusercontent.com/u/6374090?v=4" width="100;" alt="hwkr"/>
            <br />
            <sub><b>hwkr</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/cameronrohani">
            <img src="https://avatars.githubusercontent.com/u/6201407?v=4" width="100;" alt="cameronrohani"/>
            <br />
            <sub><b>cameronrohani</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/amritk">
            <img src="https://avatars.githubusercontent.com/u/2039539?v=4" width="100;" alt="amritk"/>
            <br />
            <sub><b>amritk</b></sub>
        </a>
    </td></tr>
<tr>
    <td align="center">
        <a href="https://github.com/geoffgscott">
            <img src="https://avatars.githubusercontent.com/u/59206100?v=4" width="100;" alt="geoffgscott"/>
            <br />
            <sub><b>geoffgscott</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/ATREAY">
            <img src="https://avatars.githubusercontent.com/u/66585295?v=4" width="100;" alt="ATREAY"/>
            <br />
            <sub><b>ATREAY</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Mohib834">
            <img src="https://avatars.githubusercontent.com/u/47316464?v=4" width="100;" alt="Mohib834"/>
            <br />
            <sub><b>Mohib834</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/mouhannad-sh">
            <img src="https://avatars.githubusercontent.com/u/18495740?v=4" width="100;" alt="mouhannad-sh"/>
            <br />
            <sub><b>mouhannad-sh</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/chrislearn">
            <img src="https://avatars.githubusercontent.com/u/5874864?v=4" width="100;" alt="chrislearn"/>
            <br />
            <sub><b>chrislearn</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/danp">
            <img src="https://avatars.githubusercontent.com/u/2182?v=4" width="100;" alt="danp"/>
            <br />
            <sub><b>danp</b></sub>
        </a>
    </td></tr>
<tr>
    <td align="center">
        <a href="https://github.com/jonataw">
            <img src="https://avatars.githubusercontent.com/u/29772763?v=4" width="100;" alt="jonataw"/>
            <br />
            <sub><b>jonataw</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/IHIutch">
            <img src="https://avatars.githubusercontent.com/u/20825047?v=4" width="100;" alt="IHIutch"/>
            <br />
            <sub><b>IHIutch</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Mason-Little">
            <img src="https://avatars.githubusercontent.com/u/105008441?v=4" width="100;" alt="Mason-Little"/>
            <br />
            <sub><b>Mason-Little</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/sinh117801">
            <img src="https://avatars.githubusercontent.com/u/43696715?v=4" width="100;" alt="sinh117801"/>
            <br />
            <sub><b>sinh117801</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Chinlinlee">
            <img src="https://avatars.githubusercontent.com/u/49154622?v=4" width="100;" alt="Chinlinlee"/>
            <br />
            <sub><b>Chinlinlee</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/FotieMConstant">
            <img src="https://avatars.githubusercontent.com/u/42372656?v=4" width="100;" alt="FotieMConstant"/>
            <br />
            <sub><b>FotieMConstant</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: collaborators,contributors -end -->

Contributions are welcome! Read [`CONTRIBUTING`](https://github.com/scalar/scalar/blob/main/CONTRIBUTING).

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
