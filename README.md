# Scalar API Reference

[![CI](https://github.com/scalar/scalar/actions/workflows/ci.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/ci.yml)
[![Release](https://github.com/scalar/scalar/actions/workflows/release.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/release.yml)
[![Contributors](https://img.shields.io/github/contributors/scalar/scalar)](https://github.com/scalar/scalar/graphs/contributors)
[![GitHub License](https://img.shields.io/github/license/scalar/scalar)](https://github.com/scalar/scalar/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Generate interactive API documentation from OpenAPI/Swagger files. [Try our Demo](https://docs.scalar.com/swagger-editor)

<img width="830" height="455" src="https://github.com/scalar/scalar/assets/6201407/046aaeca-f0fe-453d-a661-c747399c56ef">

## Features

- Uses OpenAPI/Swagger specifications
- Request examples for a ton of languages + frameworks
- Has an integrated API client
- Edit your OpenAPI/Swagger specification with a live preview
- Doesn’t look like it’s 2011

> [!NOTE]\
> [Scalar Townhall every 2nd Thursday in Discord](https://discord.gg/scalar?event=1219363385485824000)
>
> Join us to see upcoming features, discuss the roadmap and chat about APIs. 💬

## Table of Contents

- [Getting Started](#getting-started)
  - [CDN](#cdn)
  - [Nuxt](#nuxt)
  - [Vue.js](#vuejs)
  - [React](#react)
  - [Fastify](#fastify)
  - [Platformatic](#platformatic)
  - [.NET](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/README.md)
  - [Hono](#hono)
  - [ElysiaJS](#elysiajs)
  - [Express](#express)
  - [NestJS](#nestjs)
  - [Docusaurus](#docusaurus)
  - [Litestar](https://docs.litestar.dev/latest/usage/openapi/ui_plugins.html)
  - [FastAPI](https://github.com/scalar/scalar/blob/main/packages/scalar_fastapi/README.md)
  - [AdonisJS](#adonisjs)
  - [Laravel](#laravel)
  - [Rust](#rust)
  - [Go](#go)
  - [Free Hosting](#free-hosting)
- [CLI](#cli)
- [Markdown](#markdown)
- [Configuration](#configuration)
  - [Layouts](#layouts)
  - [Themes](#themes)
  - [Advanced: Styling](#advanced-styling)
    - [Theme Prefix Changes](#theme-prefix-changes)
- [Community](#community)
- [Packages](#packages)
- [Contributors](#contributors)
- [License](#license)

## Getting Started

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
    <!-- Add your own OpenAPI/Swagger specification URL here: -->
    <!-- Note: The example is our public proxy (to avoid CORS issues). You can remove the `data-proxy-url` attribute if you don’t need it. -->
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

### Nuxt

You can easily run Scalar API References in Nuxt via the module:

```bash
npx nuxi module add @scalar/nuxt
```

If you are using Nuxt server routes, you can enable scalar simply by enabling `openAPI` in the nitro
config in your `nuxt.config.ts`:

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

If you would like to add your own OpenAPI spec file, you can do so with the following minimal config:

```ts
export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  scalar: {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },
  },
})
```

Read more: [@scalar/nuxt](/packages/nuxt)

### Vue.js

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

You can [pass props to customize the API reference](/packages/api-reference).

### React

The API Reference package is written in Vue, that shouldn’t stop you from using
it in React though!
We have created a client side wrapper in React:

> [!WARNING]\
> This is untested on SSR/SSG!

```ts
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'

function App() {
  return (
    <ApiReferenceReact
      configuration={{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
        },
      }}
    />
  )
}

export default App
```

We wrote a [detailed integration guide for React](/documentation/react.md), too.

### Next.js

Our Next.js handler makes it easy to render a reference; just add it to an API
route handler:

```ts
// app/reference/route.ts
import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: '/openapi.json',
  },
}

export const GET = ApiReference(config)
```

We wrote a [detailed integration guide for Next.js](/documentation/nextjs.md), too.

Read more: [@scalar/nextjs-api-reference](/packages/nextjs-api-reference)

### Fastify

Our fastify plugin makes it so easy to render a reference, there’s no excuse to not have documentation for your API:

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

We wrote a [detailed integration guide for Fastify](/documentation/fastify.md), too.

Read more about the
package: [@scalar/fastify-api-reference](/packages/fastify-api-reference)

### Platformatic

Good news: If you’re
using [a recent version of Platformatic](https://github.com/platformatic/platformatic/releases/tag/v1.16.0), the Scalar
API reference is installed and configured automatically.

### Hono

Our Hono middleware makes it so easy to render a reference:

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.get(
  '/reference',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

Read more: [@scalar/hono-api-reference](/packages/hono-api-reference)

### ElysiaJS

The `@elysiajs/swagger` plugin uses our API reference by default:

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

### Express

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

Read more: [@scalar/express-api-reference](/packages/express-api-reference)

### NestJS

Our NestJS middleware makes it so easy to render a reference:

```ts
import { apiReference } from '@scalar/nestjs-api-reference'

app.use(
  '/reference',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
  }),
)
```

Read more: [@scalar/nestjs-api-reference](/packages/nestjs-api-reference)

### Docusaurus

Our Docusaurus plugin makes it easy to render API references. Simple add the
following to your Docusaurus config:

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
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
        },
      },
    } as ScalarOptions,
  ],
],
```

We wrote a [detailed integration guide for Docusaurus](/documentation/docusaurus.md), too.

For more information, check out
the [Docusaurus package](/packages/docusaurus/README.md)

### AdonisJS

There’s [a community package to generate OpenAPI files in AdonisJS,](https://github.com/hanspagel/adonis-autoswagger)
and it comes with support for the
Scalar API reference already.

We wrote a [detailed integration guide for AdonisJS](/documentation/adonisjs.md).

### Laravel

There’s [a wonderful package to generate OpenAPI files for Laravel](https://scribe.knuckles.wtf/laravel/) already.
Set the `type` to `external_laravel` (for Blade) or `external_static` (for HTML) and `theme` to `scalar`:

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

We wrote a [detailed integration guide for Laravel Scribe](/documentation/laravel-scribe.md),
too.

### Rust

There’s [a wonderful package to generate OpenAPI files for Rust](https://github.com/tamasfe/aide) already.
Set the `api_route` to use `Scalar` to get started:

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

### Go

`go-scalar-api-reference` by [@MarceloPetrucio](https://github.com/MarceloPetrucio/) offers a convenient way to generate
API references in Go:

<https://github.com/MarceloPetrucio/go-scalar-api-reference/>

### Free Hosting

- Write your API documentation and publish your API references (free)
- Get SSL and a super cool \*.apidocumentation.com subdomain (free)
- Collaborate with your whole team (paid)
- Use any domain (paid)

Ready? [Create an account on scalar.com](https://scalar.com).

## CLI

We’ve also got a nice command-line interface that you can use to play with OpenAPI files locally,
integrate validation into your CI or share them easily (with us or anyone else).

[CLI documentation](/packages/cli)

Here are a few use cases:

### Installation

You can use [npx](https://docs.npmjs.com/cli/v8/commands/npx) to use the CLI without manually installing it:

```bash
npx @scalar/cli --version
```

If you want to install it locally, you can do it like this:

```bash
npm -g install @scalar/cli
scalar --version
```

### Format

Quickly bring your OpenAPI file (JSON or YAML) into shape:

```bash
scalar format openapi.json --output openapi.yaml
```

### Validate

Validate your OpenAPI file to find errors
quickly, [great for CI](https://github.com/scalar/scalar/blob/main/.github/workflows/validate-openapi-file.yml):

```bash
scalar validate openapi.json
```

Oh, and all commands work with hosted OpenAPI files, too:

```bash
scalar validate https://example.com/openapi.json
```

### Preview

Preview the API reference for your OpenAPI file with just one command. It can even watch your file and reload the
content on file changes:

```bash
scalar serve openapi.json --watch
```

### Mock server

Designing an API, but don’t have a backend yet? Just quickly boot up a mock server like this:

```bash
scalar mock openapi.json --watch --port 8080
```

### Share

Want to share your OpenAPI file? The following command will upload the given specification [to our sandbox](https://sandbox.scalar.com/):

```bash
scalar share openapi.json
```

Read [more about the CLI here](/packages/cli).

## Markdown

You can use Markdown in various places, for example in `info.description`, in your tag descriptions, in your operation
descriptions, in your parameter descriptions and in a lot of other places. We’re using GitHub-flavored Markdown.
What’s working here, is probably also working in the API reference:

- bullet lists, numbered lists
- _italic_, **bold**, ~~striked~~ text
- accordions
- links
- tables
- images
- …

[Have a look at our OpenAPI example specification](https://github.com/scalar/scalar/blob/main/packages/galaxy/src/specifications/3.1.yaml)
to see more examples.

> Note: Not everything is supported in all places. For example, you can use images in most places, but not in parameter
> descriptions.

## Configuration

To customize the behavior of the API Reference, you can use the following configuration options:

- `spec.content`: Directly pass an OpenAPI/Swagger specifcation.
- `spec.url`: Pass the URL of a spec file (JSON or YAML).
- `proxyUrl`: Use a proxy to send requests to other origins.
- `darkMode`: Set dark mode on or off (light mode)
- `layout`: The layout to use, either of `modern` or `classic` (see [#layouts](#layouts)).
- `theme`: The theme to use (see [#themes](#themes)).
- `showSidebar`: Whether the sidebar should be shown.
- `customCss`: Pass custom CSS directly to the component.
- `searchHotKey`: Key used with CTRL/CMD to open the search modal.
- `servers`: Override the OpenAPI servers
- `metaData`: Configure meta-information for the page.
- `hiddenClients`: List of `httpsnippet` clients to hide from the client's menu, by default hides Unirest,
  pass `[]` to show all clients.
- `onSpecUpdate`: Listen to spec changes with a callback function.

For detailed information on how to use these options, refer to
the [Configuration Section](https://github.com/scalar/scalar/blob/main/packages/api-reference/README.md/#configuration).

### Layouts

We support two layouts at the moment, a `modern` layout (the default) and a Swagger UI inspired
`classic` layout (we jazzed it up a bit though).

![layouts](https://github.com/scalar/scalar/assets/6374090/a28b89e0-8d3b-477f-a02f-bcf39f7830f0)

### Themes

You don’t like the color scheme? We’ve prepared some themes for you:

```vue
/* theme?: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized' |
'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'none' */
<ApiReference :configuration="{ theme: 'moon' }" />
```

> [!NOTE]\
> The `default` theme is … the default theme.
> If you want to make sure **no** theme is applied, pass `none`.

Wow, still nothing that fits your brand? Reach out to <marc@scalar.com> and we’ll make you a custom theme, just for you.

### Advanced: Styling

You can pretty much style everything you see.
[Here’s an extreme example of what’s possible.](https://windows98.apidocumentation.com/)

To get started, overwrite our CSS variables. We won’t judge.

```html
<style>
  :root {
    --scalar-font: 'Comic Sans MS', 'Comic Sans', cursive;
  }
</style>
```

> [!NOTE]\
> By default, we’re using Inter and JetBrains Mono, served by our in-house CDN.

If you want use a different font or want to use Google Fonts, pass `withDefaultFonts: false` to the configuration and overwrite the `--scalar-font` CSS variable. You will also need to provide the source of your new font which can be local or served over the network.

Here is an example of how to use the `Roboto` font from Google Fonts with the CDN API reference.

```html
<!doctype html>
<html>
  <head>
    <!-- Link to the font on Google -->
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto"
      rel="stylesheet" />
    <!-- Overwrite the scalar font variable -->
    <style>
      :root {
        --scalar-font: 'Roboto', sans-serif;
      }
    </style>
  </head>
  <body>
    <!-- Pass the custom configuration object -->
    <script>
      var configuration = {
        theme: 'kepler',
        // Do not use the default fonts from the Scalar CDN
        withDefaultFonts: 'false',
      }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

You can [use all variables](https://github.com/scalar/scalar/blob/main/packages/themes/src/base.css) available in the
base styles as well as overwrite the color theme.

To build your own color themes, overwrite the night mode and day mode variables.
Here are some basic variables to get you started:

![basic-scalar-variables](https://github.com/scalar/scalar/assets/6374090/f49256c4-4623-4797-87a1-24bdbc9b17fd)

```html
<style>
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
</style>
```

Or get more advanced by styling our sidebar!

![scalar-sidebar-variables](https://github.com/scalar/scalar/assets/6374090/5b1f0211-5c09-4092-a882-03d8241ad428)

```html
<style>
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
</style>
```

#### Theme Prefix Changes

We've migrated our `--theme-*` CSS variables to `--scalar-*` to avoid conflicts with other CSS variables in
applications consuming the Scalar references or themes.
If you're injecting your custom CSS through the [`customCss`](#configuration) configuration option we will automatically
migrate your variable prefixes but display a warning in the console.

We recommend updating your theme variables as soon as possible:

- `--theme-*` → `--scalar-*`
- `--sidebar-*` → `--scalar-sidebar-*`

For a before and after example of an updated theme
see [`legacyTheme.css`](/packages/themes/src/fixtures/legacyTheme.css)
and [`updatedTheme.css`](/packages/themes/src/fixtures/updatedTheme.css)
in the [`@scalar/themes`](/packages/themes/) package.

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## Packages

This repository contains all our open source projects, and there’s definitely more to discover.

| Package                                                          | Description              |
| ---------------------------------------------------------------- | ------------------------ |
| [@scalar/api-client](/packages/api-client)                       | API client               |
| [@scalar/api-reference-react](/packages/api-reference-react)     | React integration        |
| [@scalar/api-reference](/packages/api-reference)                 | Beautiful API references |
| [@scalar/cli](/packages/cli)                                     | OpenAPI CLI              |
| [@scalar/docusaurus](/packages/docusaurus)                       | Docusaurus integration   |
| [@scalar/echo-server](/packages/echo-server)                     | HTTP Mirror              |
| [@scalar/express-api-reference](/packages/express-api-reference) | Express plugin           |
| [@scalar/fastify-api-reference](/packages/fastify-api-reference) | Fastify plugin           |
| [@scalar/galaxy](/packages/galaxy)                               | OpenAPI Example          |
| [@scalar/hono-api-reference](/packages/hono-api-reference)       | Hono middleware          |
| [@scalar/mock-server](/packages/mock-server)                     | OpenAPI Mock Server      |
| [@scalar/nestjs-api-reference](/packages/nestjs-api-reference)   | NestJS middleware        |
| [@scalar/nextjs-api-reference](/packages/nextjs-api-reference)   | Next.js adapter          |
| [@scalar/nuxt](/packages/nuxt)                                   | Nuxt module              |
| [@scalar/play-button](/packages/play-button)                     | Quick API Client Embed   |

## Contributors

Contributions are welcome! Read [`CONTRIBUTING`](https://github.com/scalar/scalar/blob/main/CONTRIBUTING).

<!-- readme: collaborators,contributors -start -->
<table>
	<tbody>
		<tr>
            <td align="center">
                <a href="https://github.com/hanspagel">
                    <img src="https://avatars.githubusercontent.com/u/1577992?v=4" width="100;" alt="hanspagel"/>
                    <br />
                    <sub><b>hanspagel</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/amritk">
                    <img src="https://avatars.githubusercontent.com/u/2039539?v=4" width="100;" alt="amritk"/>
                    <br />
                    <sub><b>amritk</b></sub>
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
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/antlio">
                    <img src="https://avatars.githubusercontent.com/u/14966155?v=4" width="100;" alt="antlio"/>
                    <br />
                    <sub><b>antlio</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/geoffgscott">
                    <img src="https://avatars.githubusercontent.com/u/59206100?v=4" width="100;" alt="geoffgscott"/>
                    <br />
                    <sub><b>geoffgscott</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Amorim33">
                    <img src="https://avatars.githubusercontent.com/u/42624869?v=4" width="100;" alt="Amorim33"/>
                    <br />
                    <sub><b>Amorim33</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/adjsky">
                    <img src="https://avatars.githubusercontent.com/u/49305219?v=4" width="100;" alt="adjsky"/>
                    <br />
                    <sub><b>adjsky</b></sub>
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
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/mcollina">
                    <img src="https://avatars.githubusercontent.com/u/52195?v=4" width="100;" alt="mcollina"/>
                    <br />
                    <sub><b>mcollina</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/hex0id">
                    <img src="https://avatars.githubusercontent.com/u/5276261?v=4" width="100;" alt="hex0id"/>
                    <br />
                    <sub><b>hex0id</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/mpminardi">
                    <img src="https://avatars.githubusercontent.com/u/8587567?v=4" width="100;" alt="mpminardi"/>
                    <br />
                    <sub><b>mpminardi</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ykdojo">
                    <img src="https://avatars.githubusercontent.com/u/1811651?v=4" width="100;" alt="ykdojo"/>
                    <br />
                    <sub><b>ykdojo</b></sub>
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
                <a href="https://github.com/gsmcdonald">
                    <img src="https://avatars.githubusercontent.com/u/36003378?v=4" width="100;" alt="gsmcdonald"/>
                    <br />
                    <sub><b>gsmcdonald</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/federicobond">
                    <img src="https://avatars.githubusercontent.com/u/138426?v=4" width="100;" alt="federicobond"/>
                    <br />
                    <sub><b>federicobond</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/sigpwned">
                    <img src="https://avatars.githubusercontent.com/u/1236302?v=4" width="100;" alt="sigpwned"/>
                    <br />
                    <sub><b>sigpwned</b></sub>
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
                <a href="https://github.com/MaxBreida">
                    <img src="https://avatars.githubusercontent.com/u/18685579?v=4" width="100;" alt="MaxBreida"/>
                    <br />
                    <sub><b>MaxBreida</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/rickihastings">
                    <img src="https://avatars.githubusercontent.com/u/45660?v=4" width="100;" alt="rickihastings"/>
                    <br />
                    <sub><b>rickihastings</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/rbange">
                    <img src="https://avatars.githubusercontent.com/u/13252574?v=4" width="100;" alt="rbange"/>
                    <br />
                    <sub><b>rbange</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/STP5940">
                    <img src="https://avatars.githubusercontent.com/u/21144303?v=4" width="100;" alt="STP5940"/>
                    <br />
                    <sub><b>STP5940</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/realsama">
                    <img src="https://avatars.githubusercontent.com/u/46403284?v=4" width="100;" alt="realsama"/>
                    <br />
                    <sub><b>realsama</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/SebastianBienert">
                    <img src="https://avatars.githubusercontent.com/u/17458785?v=4" width="100;" alt="SebastianBienert"/>
                    <br />
                    <sub><b>SebastianBienert</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/dotfortun">
                    <img src="https://avatars.githubusercontent.com/u/11822957?v=4" width="100;" alt="dotfortun"/>
                    <br />
                    <sub><b>dotfortun</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/soGit">
                    <img src="https://avatars.githubusercontent.com/u/10682798?v=4" width="100;" alt="soGit"/>
                    <br />
                    <sub><b>soGit</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/sinh117801">
                    <img src="https://avatars.githubusercontent.com/u/43696715?v=4" width="100;" alt="sinh117801"/>
                    <br />
                    <sub><b>sinh117801</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/soulchild">
                    <img src="https://avatars.githubusercontent.com/u/59642?v=4" width="100;" alt="soulchild"/>
                    <br />
                    <sub><b>soulchild</b></sub>
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
                <a href="https://github.com/WilliamBonvini">
                    <img src="https://avatars.githubusercontent.com/u/37834150?v=4" width="100;" alt="WilliamBonvini"/>
                    <br />
                    <sub><b>WilliamBonvini</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/x-delfino">
                    <img src="https://avatars.githubusercontent.com/u/67192579?v=4" width="100;" alt="x-delfino"/>
                    <br />
                    <sub><b>x-delfino</b></sub>
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
                <a href="https://github.com/dunklesToast">
                    <img src="https://avatars.githubusercontent.com/u/17279485?v=4" width="100;" alt="dunklesToast"/>
                    <br />
                    <sub><b>dunklesToast</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/tsiwek-piwik">
                    <img src="https://avatars.githubusercontent.com/u/117373332?v=4" width="100;" alt="tsiwek-piwik"/>
                    <br />
                    <sub><b>tsiwek-piwik</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/arashsheyda">
                    <img src="https://avatars.githubusercontent.com/u/38922203?v=4" width="100;" alt="arashsheyda"/>
                    <br />
                    <sub><b>arashsheyda</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/arthurfiorette">
                    <img src="https://avatars.githubusercontent.com/u/47537704?v=4" width="100;" alt="arthurfiorette"/>
                    <br />
                    <sub><b>arthurfiorette</b></sub>
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
            </td>
            <td align="center">
                <a href="https://github.com/lundibundi">
                    <img src="https://avatars.githubusercontent.com/u/9109612?v=4" width="100;" alt="lundibundi"/>
                    <br />
                    <sub><b>lundibundi</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/Edgaraszs">
                    <img src="https://avatars.githubusercontent.com/u/55696268?v=4" width="100;" alt="Edgaraszs"/>
                    <br />
                    <sub><b>Edgaraszs</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/emmanuel-ferdman">
                    <img src="https://avatars.githubusercontent.com/u/35470921?v=4" width="100;" alt="emmanuel-ferdman"/>
                    <br />
                    <sub><b>emmanuel-ferdman</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Fdawgs">
                    <img src="https://avatars.githubusercontent.com/u/43814140?v=4" width="100;" alt="Fdawgs"/>
                    <br />
                    <sub><b>Fdawgs</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/GreyXor">
                    <img src="https://avatars.githubusercontent.com/u/79602273?v=4" width="100;" alt="GreyXor"/>
                    <br />
                    <sub><b>GreyXor</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/HelgeSverre">
                    <img src="https://avatars.githubusercontent.com/u/1089652?v=4" width="100;" alt="HelgeSverre"/>
                    <br />
                    <sub><b>HelgeSverre</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/CJHwong">
                    <img src="https://avatars.githubusercontent.com/u/906057?v=4" width="100;" alt="CJHwong"/>
                    <br />
                    <sub><b>CJHwong</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/IceyWu">
                    <img src="https://avatars.githubusercontent.com/u/66096254?v=4" width="100;" alt="IceyWu"/>
                    <br />
                    <sub><b>IceyWu</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/JacobCoffee">
                    <img src="https://avatars.githubusercontent.com/u/45884264?v=4" width="100;" alt="JacobCoffee"/>
                    <br />
                    <sub><b>JacobCoffee</b></sub>
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
                <a href="https://github.com/IHIutch">
                    <img src="https://avatars.githubusercontent.com/u/20825047?v=4" width="100;" alt="IHIutch"/>
                    <br />
                    <sub><b>IHIutch</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/KiARC">
                    <img src="https://avatars.githubusercontent.com/u/73847484?v=4" width="100;" alt="KiARC"/>
                    <br />
                    <sub><b>KiARC</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/kyllian">
                    <img src="https://avatars.githubusercontent.com/u/5831233?v=4" width="100;" alt="kyllian"/>
                    <br />
                    <sub><b>kyllian</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/ShadiestGoat">
                    <img src="https://avatars.githubusercontent.com/u/48590492?v=4" width="100;" alt="ShadiestGoat"/>
                    <br />
                    <sub><b>ShadiestGoat</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/MarioGK">
                    <img src="https://avatars.githubusercontent.com/u/8379079?v=4" width="100;" alt="MarioGK"/>
                    <br />
                    <sub><b>MarioGK</b></sub>
                </a>
            </td>
		</tr>
	<tbody>
</table>
<!-- readme: collaborators,contributors -end -->

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
