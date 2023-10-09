# Scalar API Reference

![Version](https://img.shields.io/npm/v/%40scalar/api-reference)
![Downloads](https://img.shields.io/npm/dm/%40scalar/api-reference)
![License](https://img.shields.io/npm/l/%40scalar%2Fapi-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/mw6FQRPh)

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

## Props

#### isEditable?: boolean

Whether the Swagger editor should be shown.

```vue
<ApiReference :isEditable="true" />
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

#### transformedSpec?: string

You can preprocess specs with `@scalar/swagger-parser` and directly pass the result.

```vue
<ApiReference :specResult="{ … }" />
```

#### proxyUrl?: string

Making requests to other domains is restricted in the browser and requires [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). It’s recommended to use a proxy to send requests to other origins.

```vue
<ApiReference proxyUrl="https://proxy.example.com" />
```

ℹ️ You can use [@scalar/api-client-proxy](https://github.com/scalar/scalar/tree/main/packages/api-client-proxy) to host your own proxy or you can just use ours:

```vue
<ApiReference proxyUrl="https://api.scalar.com/request-proxy" />
```

#### initialTabState?: string

You can decide which tab should be active by default:

```vue
<ApiReference initialTabState="Getting Started" />
<!-- or -->
<ApiReference initialTabState="Swagger Editor" />
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
