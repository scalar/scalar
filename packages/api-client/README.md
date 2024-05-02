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

```vue
<script setup>
import { ApiClient } from '@scalar/api-client'
</script>

<template>
  <ApiClient />
</template>
```

## Props

### proxyUrl?: string

Pass an URL of [a request proxy](https://github.com/scalar/scalar/tree/main/packages/api-client-proxy) to avoid CORS issues.

## Composable

You can use `useRequestStore()` to interact with the API client.

### readOnly

```js
const { readOnly } = useRequestStore()

readOnly.value = false
```

### activeRequest

```js
const { activeRequest } = useRequestStore()

console.log(activeRequest)
```

### setActiveRequest

```js
const { setActiveRequest } = useRequestStore()

setActiveRequest({
  url: 'https://echo.scalar.com'
  type: 'GET,
  path: '/foobar'
})
```
