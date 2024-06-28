# Scalar API Client

[![Version](https://img.shields.io/npm/v/%40scalar/api-client)](https://www.npmjs.com/package/@scalar/api-client)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client)](https://www.npmjs.com/package/@scalar/api-client)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client)](https://www.npmjs.com/package/@scalar/api-client)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/api-client
```

## Usage

```ts
import { createScalarApiClient } from '@scalar/api-client'

const targetElement = document.getElementById('root')

// Initialize
const { open } = await createScalarApiClient(targetElement, {
  spec: {
    // Load a spec from URL
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    // OR the spec directly
    content: {
      ...
    }
  },
  proxyUrl: 'https://proxy.scalar.com',
})

// Open the API client right-away
open()

// Or: Open a specific operation
open({
  method: 'GET',
  path: '/me',
})
```

## Configuration

```ts
/** Configuration options for the Scalar API client */
export type ClientConfiguration = {
  /** The Swagger/OpenAPI spec to render */
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

The following methods are returned from the `createScalarApiClient` call:

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
