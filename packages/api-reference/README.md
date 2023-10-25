# Scalar API Reference

![Version](https://img.shields.io/npm/v/%40scalar/api-reference)
![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference)
![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

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

You can even [mount the component in React](https://github.com/scalar/scalar/blob/main/projects/react/src/App.tsx).

## Configuration

There's a configuration object that can be used on all platforms. In Vue.js, you use it like this:

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
<ApiReference :configuration="{ spec: { url: '/swagger.json' } }" />
```

#### spec.preparsedContent?: string

You can preprocess specs with `@scalar/swagger-parser` and directly pass the result.

```vue
<ApiReference :configuration="{ spec: { preparsedContent : '{ … }' } } />
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

#### initialContent?: string

You can decide which tab should be active by default:

```vue
<ApiReference
  :initialTabState="{ tabs: { initialContent: 'Getting Started' } }" />
<!-- or -->
<ApiReference :configuration="{ tabs: { initialContent: 'Swagger Editor' } }" />
```

#### showSidebar?: boolean

Whether the sidebar should be shown.

```vue
<ApiReference :configuration="{ showSidebar: true} />
```

#### footerBelowSidebar?: boolean

Whether the footer should be below the content or below both the content _and_ the sidebar.

```vue
<ApiReference :configuration="{ footerBelowSidebar: true} />
```
