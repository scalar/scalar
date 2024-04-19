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

> [Scalar Townhall on Thu Mar, 28th in Discord](https://discord.gg/bcCycarP3D?event=1219363385485824000)
>
> Join us to see upcoming features, discuss the roadmap and chat about APIs with us. 💬

## Table of Contents

- [Getting Started](#getting-started)
  - [From a CDN](#from-a-cdn)
  - [With Nuxt](#with-nuxt)
  - [With Vue.js](#with-vuejs)
  - [With React](#with-react)
  - [With Nextjs](#with-nextjs)
  - [With Fastify](#with-fastify)
  - [With Platformatic](#with-platformatic)
  - [With Hono](#with-hono)
  - [With ElysiaJS](#with-elysiajs)
  - [With Express](#with-express)
  - [With NestJS](#with-nestjs)
  - [With Docusaurus](#with-docusaurus)
  - [With AdonisJS](#with-adonisjs)
  - [With Laravel](#with-laravel)
  - [With Rust](#with-rust)
- [Hosted API Reference](#hosted-api-reference)
- [Configuration](#configuration)
- [Layouts](#layouts)
- [Themes](#themes)
- [Advanced: Styling](#advanced-styling)
- [Community](#community)
- [Packages](#packages)
- [Contributors](#contributors)
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
  </head>
  <body>
    <!-- Add your own OpenAPI/Swagger spec file URL here: -->
    <!-- Note: this includes our proxy, you can remove the following line if you do not need it -->
    <!-- data-proxy-url="https://api.scalar.com/request-proxy" -->
    <script
      id="api-reference"
      data-url="https://petstore3.swagger.io/api/v3/openapi.json"
      data-proxy-url="https://api.scalar.com/request-proxy"></script>
    <!-- You can also set a full configuration object like this -->
    <!-- easier for nested objects -->
    <script>
      var configuration = {
        theme: 'purple',
      }

      var apiReference = document.getElementById('api-reference')
      apiReference.dataset.configuration = JSON.stringify(configuration)
    </script>
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

### With Nuxt

You can easily run Scalar API References in Nuxt via the module.

```bash
npx nuxi module add @scalar/nuxt
```

If you are using nuxt server routes you can enable scalar simply by enabling openAPI in the nitro
config in your nuxt.config.ts

```ts
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
```

If you would like to add your own OpenAPI spec file you can do so with the following minimal config

```ts
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    spec: {
      url: 'https://cdn.scalar.com/spec/openapi_petstore.json',
    },
  },
})
```

Read more: [@scalar/nuxt](https://github.com/scalar/scalar/tree/main/packages/nuxt)

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

The API Reference package is written in Vue, that shouldn’t stop you from using
it in React though! We have created a client side (untested on SSR/SSG) wrapper
in react.

```ts
import { ApiReferenceReact } from '@scalar/api-reference-react'
import React from 'react'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
      }}
    />
  )
}

export default App
```

### With Nextjs

Our Next.js handler makes it easy to render a reference, just add it to an Api
route handler:

```ts
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: '/swagger.json',
  },
}

export const GET = ApiReference(config)
```

Read more: [@scalar/nextjs-api-reference](https://github.com/scalar/scalar/tree/main/packages/nextjs-api-reference)

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

We wrote a [detailed integration guide for Fastify](https://github.com/scalar/scalar/tree/main/documentation/fastify.md), too.

Read more about the package: [@scalar/fastify-api-reference](https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference)

### With Platformatic

Good news: If you’re using [a recent version of Platformatic](https://github.com/platformatic/platformatic/releases/tag/v1.16.0), the Scalar API reference is installed and configured automatically.

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

### With ElysiaJS

The @elysiajs/swagger plugin uses our API reference by default.

```ts
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'

new Elysia()
  .use(swagger())
  .get('/', () => 'hi')
  .post('/hello', () => 'world')
  .listen(8080)

// open http://localhost:8080/swagger
```

[Read more about @elysiajs/swagger](https://elysiajs.com/plugins/swagger.html)

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

### With Docusaurus

Our Docusaurus plugin makes it easy to render API references. Simple add the
following to your Docusaurus config

```ts
import type { ScalarOptions } from '@scalar/docusaurus'

plugins: [
  [
    '@scalar/docusaurus',
    {
      label: 'Scalar',
      route: '/scalar',
      configuration: {
        spec: {
          url: 'https://petstore3.swagger.io/api/v3/openapi.json',
        },
      },
    } as ScalarOptions,
  ],
],
```

For more information, check out the [Docusaurus package](https://github.com/scalar/scalar/tree/main/packages/docusaurus/README.md)

### With AdonisJS

There’s [a community package to generate OpenAPI files in AdonisJS](https://github.com/hanspagel/adonis-autoswagger) and it comes with support for the Scalar API reference already.

We wrote a [detailed integration guide for AdonisJS](https://github.com/scalar/scalar/tree/main/documentation/adonisjs.md).

### With Laravel

There’s [a wonderful package to generate OpenAPI files for Laravel](https://scribe.knuckles.wtf/laravel/) already. Just set the `type` to `external_laravel` (for Blade) or `external_static` (for HTML) and `theme` to `scalar`:

```php
<?php
// config/scribe.php

return [
  // …
  'type' => 'external_laravel',
  'theme' => 'scalar',
  // …
];
```

We wrote a [detailed integration guide for Laravel Scribe](https://github.com/scalar/scalar/tree/main/documentation/laravel-scribe.md), too.

### With Rust

There’s [a wonderful package to generate OpenAPI files for Rust](https://github.com/tamasfe/aide) already. Just set the `api_route` to use `Scalar` to get started:

```rust
use aide::{
    axum::{
        routing::{get_with},
        ApiRouter, IntoApiResponse,
    },
    openapi::OpenApi,
    scalar::Scalar,
};
...
    let router: ApiRouter = ApiRouter::new()
        .api_route_with(
            "/",
            get_with(
                Scalar::new("/docs/private/api.json")
                    .with_title("Aide Axum")
                    .axum_handler(),
                |op| op.description("This documentation page."),
            ),
            |p| p.security_requirement("ApiKey"),
        )
        ...
```

## Hosted API Reference

Wait, this is open source and you can do whatever you want. But if you want to add a nice, customizable guide, collaborate with your team and have everything served through a CDN, create an account on [scalar.com](https://scalar.com).

## Configuration

To customize the behavior of the API Reference, you can use the following configuration options:

- `isEditable`: Whether the Swagger editor should be shown.
- `spec.content`: Directly pass an OpenAPI/Swagger spec.
- `spec.url`: Pass the URL of a spec file (JSON or YAML).
- `proxyUrl`: Use a proxy to send requests to other origins.
- `darkMode`: Set dark mode on or off (light mode)
- `layout`: The layout to use, either of `modern` or `classic` (see [#layouts](#layouts)).
- `theme`: The them to use (see [#themes](#themes)).
- `showSidebar`: Whether the sidebar should be shown.
- `customCss`: Pass custom CSS directly to the component.
- `searchHotKey`: Key used with CNTRL/CMD to open the search modal.
- `metaData`: Configure meta information for the page.
- `hiddenClients`: List of httpsnippet clients to hide from the clients menu, by default hides Unirest, pass `[]` to show all clients.
- `onSpecUpdate`: Listen to spec changes with a callback function.

For detailed information on how to use these options, refer to the [Configuration Section](https://github.com/scalar/scalar/blob/main/packages/api-reference/README.md/#configuration).

## Layouts

We support two layouts at the moment, a `modern` layout (the default) and a Swagger UI inspired `classic` layout (we jazzed it up a bit though).

![layouts](https://github.com/scalar/scalar/assets/6374090/a28b89e0-8d3b-477f-a02f-bcf39f7830f0)

## Themes

You don’t like the color scheme? We’ve prepared some themes for you:

```vue
/* theme?: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized' |
'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'none' */
<ApiReference :configuration="{ theme: 'moon' }" />
```

ℹ️ The `default` theme is … the default theme. If you want to make sure no theme is applied, pass `none`.

## Advanced: Styling

Overwrite our CSS variables. We won’t judge.

```
:root {
  --scalar-font: 'Comic Sans MS', 'Comic Sans', cursive;
}
```

You can [use all variables](https://github.com/scalar/scalar/blob/main/packages/themes/src/base.css) available in the base styles as well as overwrite the color theme.

To build your own color themes overwrite the night mode and day mode variables. Here are some basic variables to get you started:

![basic-scalar-variables](https://github.com/scalar/scalar/assets/6374090/f49256c4-4623-4797-87a1-24bdbc9b17fd)

```
.light-mode {
  --scalar-color-1: #121212;
  --scalar-color-2: rgba(0, 0, 0, 0.6);
  --scalar-color-3: rgba(0, 0, 0, 0.4);
  --scalar-color-accent: #0a85d1;
  --scalar-background-1: #fff;
  --scalar-background-2: #f6f5f4;
  --scalar-background-3: #f1ede9;
  --scalar-background-accent: #5369d20f;
  --scalar-border-color: rgba(0, 0, 0, 0.08);
}
.dark-mode {
  --scalar-color-1: rgba(255, 255, 255, 0.81);
  --scalar-color-2: rgba(255, 255, 255, 0.443);
  --scalar-color-3: rgba(255, 255, 255, 0.282);
  --scalar-color-accent: #8ab4f8;
  --scalar-background-1: #202020;
  --scalar-background-2: #272727;
  --scalar-background-3: #333333;
  --scalar-background-accent: #8ab4f81f;
}
```

Or get more advanced by styling our sidebar!

![scalar-sidebar-variables](https://github.com/scalar/scalar/assets/6374090/5b1f0211-5c09-4092-a882-03d8241ad428)

```
.light-mode .sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: currentColor;
  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-active-background: var(--scalar-background-2);
  --scalar-sidebar-border-color: var(--scalar-border-color);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-2);
  --scalar-sidebar-search-background: var(--scalar-background-2);
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
  --scalar-sidebar-search-color: var(--scalar-color-3);
}
.dark-mode .sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-item-hover-color: currentColor;
  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-active-background: var(--scalar-background-2);
  --scalar-sidebar-border-color: var(--scalar-border-color);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-color-active: var(--scalar-color-2);
  --scalar-sidebar-search-background: var(--scalar-background-2);
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
  --scalar-sidebar-search-color: var(--scalar-color-3);
}
```

### Theme Prefix Changes

We've migrated our `--theme-*` CSS variables to `--scalar-*` to avoid conflicts with other CSS variables in applications consuming the Scalar references or themes. If you're injecting your custom CSS through the [`customCss`](#configuration) configuration option we will automatically migrate your variable prefixes but display a warning in the console.

We recommend updating your theme variables as soon as possible:

- `--theme-*` → `--scalar-*`
- `--sidebar-*` → `--scalar-sidebar-*`

For a before and after example of an updated theme see [`legacyTheme.css`](https://github.com/scalar/scalar/tree/main/packages/themes/src/fixtures/legacyTheme.css) and [`updatedTheme.css`](https://github.com/scalar/scalar/tree/main/packages/themes/src/fixtures/updatedTheme.css) in the [`@scalar/themes`](https://github.com/scalar/scalar/tree/main/packages/themes/) package.

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/8HeZcRGPFS>

## Packages

This repository contains all our open source projects and there’s definitely more to discover.

| Package                                                                                                    | Description                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [@scalar/api-client-proxy](https://github.com/scalar/scalar/tree/main/packages/api-client-proxy)           | API request proxy                                 |
| [@scalar/api-client](https://github.com/scalar/scalar/tree/main/packages/api-client)                       | API testing client                                |
| [@scalar/api-reference](https://github.com/scalar/scalar/tree/main/packages/api-reference)                 | beautiful API references                          |
| [@scalar/cli](https://github.com/scalar/scalar/tree/main/packages/cli)                                     | CLI to work with OpenAPi files                    |
| [@scalar/echo-server](https://github.com/scalar/scalar/tree/main/packages/echo-server)                     | a server that replies with the request data       |
| [@scalar/express-api-reference](https://github.com/scalar/scalar/tree/main/packages/express-api-reference) | Express plugin                                    |
| [@scalar/fastify-api-reference](https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference) | Fastify plugin                                    |
| [@scalar/hono-api-reference](https://github.com/scalar/scalar/tree/main/packages/hono-api-reference)       | Hono middleware                                   |
| [@scalar/mock-server](https://github.com/scalar/scalar/tree/main/packages/mock-server)                     | fake data based on an OpenAPI specification files |
| [@scalar/nestjs-api-reference](https://github.com/scalar/scalar/tree/main/packages/nestjs-api-reference)   | NestJS middleware                                 |
| [@scalar/nextjs-api-reference](https://github.com/scalar/scalar/tree/main/packages/nestjs-api-reference)   | Next.js adapter                                   |
| [@scalar/swagger-editor](https://github.com/scalar/scalar/tree/main/packages/swagger-editor)               | editor tailored to write OpenAPI files            |
| [@scalar/swagger-parser](https://github.com/scalar/scalar/tree/main/packages/swagger-parser)               | parse OpenAPI files                               |

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
        <a href="https://github.com/mcollina">
            <img src="https://avatars.githubusercontent.com/u/52195?v=4" width="100;" alt="mcollina"/>
            <br />
            <sub><b>mcollina</b></sub>
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
        <a href="https://github.com/Amorim33">
            <img src="https://avatars.githubusercontent.com/u/42624869?v=4" width="100;" alt="Amorim33"/>
            <br />
            <sub><b>Amorim33</b></sub>
        </a>
    </td></tr>
<tr>
    <td align="center">
        <a href="https://github.com/dunklesToast">
            <img src="https://avatars.githubusercontent.com/u/17279485?v=4" width="100;" alt="dunklesToast"/>
            <br />
            <sub><b>dunklesToast</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/FotieMConstant">
            <img src="https://avatars.githubusercontent.com/u/42372656?v=4" width="100;" alt="FotieMConstant"/>
            <br />
            <sub><b>FotieMConstant</b></sub>
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
        <a href="https://github.com/soulchild">
            <img src="https://avatars.githubusercontent.com/u/59642?v=4" width="100;" alt="soulchild"/>
            <br />
            <sub><b>soulchild</b></sub>
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
        <a href="https://github.com/dotfortun">
            <img src="https://avatars.githubusercontent.com/u/11822957?v=4" width="100;" alt="dotfortun"/>
            <br />
            <sub><b>dotfortun</b></sub>
        </a>
    </td></tr>
<tr>
    <td align="center">
        <a href="https://github.com/SebastianBienert">
            <img src="https://avatars.githubusercontent.com/u/17458785?v=4" width="100;" alt="SebastianBienert"/>
            <br />
            <sub><b>SebastianBienert</b></sub>
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
        <a href="https://github.com/ShadiestGoat">
            <img src="https://avatars.githubusercontent.com/u/48590492?v=4" width="100;" alt="ShadiestGoat"/>
            <br />
            <sub><b>ShadiestGoat</b></sub>
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
        <a href="https://github.com/jonataw">
            <img src="https://avatars.githubusercontent.com/u/29772763?v=4" width="100;" alt="jonataw"/>
            <br />
            <sub><b>jonataw</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Fdawgs">
            <img src="https://avatars.githubusercontent.com/u/43814140?v=4" width="100;" alt="Fdawgs"/>
            <br />
            <sub><b>Fdawgs</b></sub>
        </a>
    </td></tr>
<tr>
    <td align="center">
        <a href="https://github.com/danp">
            <img src="https://avatars.githubusercontent.com/u/2182?v=4" width="100;" alt="danp"/>
            <br />
            <sub><b>danp</b></sub>
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
        <a href="https://github.com/sigpwned">
            <img src="https://avatars.githubusercontent.com/u/1236302?v=4" width="100;" alt="sigpwned"/>
            <br />
            <sub><b>sigpwned</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: collaborators,contributors -end -->

Contributions are welcome! Read [`CONTRIBUTING`](https://github.com/scalar/scalar/blob/main/CONTRIBUTING).

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
