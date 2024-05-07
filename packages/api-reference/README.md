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
</script>

<template>
  <ApiReference />
</template>
```

You can even [mount the component in React](https://github.com/scalar/scalar/blob/main/examples/react/src/App.tsx).

## Configuration

There’s a configuration object that can be used on all platforms. In Vue.js, you use it like this:

#### isEditable?: boolean

Whether the Swagger editor should be shown.

```vue
<ApiReference :configuration="{ isEditable: true }" />
```

#### spec.content?: string

Directly pass an OpenAPI/Swagger spec.

```vue
<ApiReference :configuration="{ spec: { content: '{ … }' } }" />
```

#### spec.url?: string

Pass the URL of a spec file (JSON or Yaml).

```vue
<ApiReference :configuration="{ spec: { url: '/openapi.json' } }" />
```

#### proxyUrl?: string

Making requests to other domains is restricted in the browser and requires [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). It’s recommended to use a proxy to send requests to other origins.

```vue
<ApiReference :configuration="{ proxy: 'https://proxy.example.com' }" />
```

ℹ️ You can use [@scalar/api-client-proxy](https://github.com/scalar/scalar/tree/main/packages/api-client-proxy) to host your own proxy or you can just use ours:

```vue
<ApiReference
  :configuration="{ proxy: 'https://api.scalar.com/request-proxy' }" />
```

#### showSidebar?: boolean

Whether the sidebar should be shown.

```vue
<ApiReference :configuration="{ showSidebar: true } />
```

#### hideModels?: boolean

Whether models (`components.schemas` or `definitions`) should be shown in the sidebar, search and content.

`@default false`

```vue
<ApiReference :configuration="{ hideModels: true } />
```

#### hideDownloadButton?: boolean

Whether to show the "Download OpenAPI Specification" button

`@default false`

```vue
<ApiReference :configuration="{ hideDownloadButton: true } />
```

### customCss?: string

You can pass custom CSS directly to the component. This is helpful for the integrations for Fastify, Express, Hono and others where you it’s easier to add CSS to the configuration.

In Vue or React you’d probably use other ways to add custom CSS.

```vue
<script setup>
const customCss = `* { font-family: "Comic Sans MS", cursive, sans-serif; }`
</script>

<template>
  <ApiReference :configuration="{ customCss }" />
</template>
```

#### searchHotKey?: string

Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k)

```vue
<ApiReference :configuration="{ searchHotKey: 'l'} />
```

#### metaData?: object

You can pass information to the config object to configure meta information out of the box.

```vue
<ApiReference :configuration="{
  metaData: {
        title: 'Page title',
        description: 'My page page',
        ogDescription: 'Still about my my page',
        ogTitle: 'Page title',
        ogImage: 'https://example.com/image.png',
        twitterCard: 'summary_large_image',
        //Add more...
      }
  } />
```

#### hiddenClients?: array

You can pass an array of [httpsnippet clients](https://github.com/Kong/httpsnippet/wiki/Targets) to hide from the clients menu.

```vue
<ApiReference :configuration="{
  hiddenClients: ['fetch']
  } />
```

By default hides Unirest, pass `[]` to show all clients

#### onSpecUpdate?: (spec: string) => void

You can listen to spec changes with onSpecUpdate that runs on spec/swagger content change

```vue
<ApiReference :configuration="{
    onSpecUpdate: (value: string) => {
      console.log('Content updated:', value)
    }
  } />
```

#### authentication?: Partial<AuthenticationState>

To make authentication easier you can prefill the credentials for your users:

```vue
<ApiReference :configuration="{
  authentication: {
      // The OpenAPI file has keys for all security schemes:
      // Which one should be used by default?
      preferredSecurityScheme: 'my_custom_security_scheme',
      // The `my_custom_security_scheme` security scheme is of type `apiKey`, so prefill the token:
      apiKey: {
        token: 'super-secret-token',
      },
    },
  } />
```

For OpenAuth2 it’s more looking like this:

```vue
<ApiReference :configuration="{
  authentication: {
      // The OpenAPI file has keys for all security schemes
      // Which one should be used by default?
      preferredSecurityScheme: 'planets_auth',
      // The `petstore_auth` security scheme is of type `oAuth2`, so prefill the client id and the scopes:
      oAuth2: {
        clientId: 'foobar123',
        // optional:
        scopes: ['read:planets', 'write:planets'],
      },
    },
  } />
```

#### withDefaultFonts?: boolean

By default we’re using Inter and JetBrains Mono, served by Google Fonts. If you use a different font or just don’t want to use Google Fonts, pass `withDefaultFonts: false` to the configuration.

```vue
<ApiReference :configuration="{
  withDefaultFonts: false
} />
```
