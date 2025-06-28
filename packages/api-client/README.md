# Scalar API Client

[![Version](https://img.shields.io/npm/v/%40scalar/api-client)](https://www.npmjs.com/package/@scalar/api-client)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client)](https://www.npmjs.com/package/@scalar/api-client)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client)](https://www.npmjs.com/package/@scalar/api-client)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

The Scalar API Client is a powerful tool designed to simplify API testing and integration. This versatile package offers multiple usage options:

- standalone application for quick and easy API testing
- embeddable component in various frontend environments
- customizable module that can be integrated into existing projects

## Features

- Intuitive interface for sending API requests and viewing responses
- Support for multiple authentication methods
- Real-time request/response logging
- Customizable request headers and parameters
- Response visualization and formatting options

## Installation

```bash
npm install @scalar/api-client
```

## Usage

### App

You can mount the full-blown API Client to your DOM like this:

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <title>Scalar API Client App</title>
  </head>
  <body>
    <div
      id="scalar-client"
      class="scalar-app scalar-client"></div>
    <script
      type="module"
      src="./main.js"></script>
  </body>
</html>
```

```ts
// main.js
import { createApiClientApp } from '@/App'

// Initialize
await createApiClientApp(document.getElementById('scalar-client'), {
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  proxyUrl: 'https://proxy.scalar.com',
})
```

### Modal

Or you can mount a more compact version, which is living in a modal:

```ts
// main.js
import { createApiClientApp } from '@/App'

// Initialize
const { open } = await createApiClientApp(
  document.getElementById('scalar-client'),
  {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    proxyUrl: 'https://proxy.scalar.com',
  },
)

// Open the API client right-away
open()

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })
```

## Configuration

```ts
/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  /** The Swagger/OpenAPI document to render */
  spec: SpecConfiguration
  /** Pass in a proxy to the API client */
  proxyUrl?: string
  /** Pass in a theme API client */
  themeId?: string
  /** Whether to show the sidebar */
  showSidebar?: boolean
  /** Whether dark mode is on or off initially (light mode) */
  // darkMode?: boolean
  /** Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k) */
  searchHotKey?:
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'g'
    | 'h'
    | 'i'
    | 'j'
    | 'k'
    | 'l'
    | 'm'
    | 'n'
    | 'o'
    | 'p'
    | 'q'
    | 'r'
    | 's'
    | 't'
    | 'u'
    | 'v'
    | 'w'
    | 'x'
    | 'y'
    | 'z'
}
```

## Available Methods

The following methods are returned from the `createApiClientModal` call:

### open

Opens the modal while allowing you to select which request to open to

```ts
open({ path: string; method: RequestMethod })
```

### updateConfig

Allows you to update the config at any time, this will clear your current state and re-import a fresh spec!

```ts
updateConfig(newConfig: ClientConfiguration, mergeConfigs?: boolean): void
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
