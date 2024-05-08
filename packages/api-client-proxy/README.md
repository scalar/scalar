# Scalar API Client Proxy

[![Version](https://img.shields.io/npm/v/%40scalar/api-client-proxy)](https://www.npmjs.com/package/@scalar/api-client-proxy)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/api-client-proxy)](https://www.npmjs.com/package/@scalar/api-client-proxy)
[![License](https://img.shields.io/npm/l/%40scalar%2Fapi-client-proxy)](https://www.npmjs.com/package/@scalar/api-client-proxy)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

> Deprecated! [We’re using a Go proxy now.](https://github.com/scalar/scalar/tree/main/examples/proxy-server)

The Scalar API Client Proxy redirects requests to another server to avoid CORS issues. Works well with the Scalar API Client.

## Installation

```bash
npm install @scalar/api-client-proxy
```

## Usage

Create a new Node.js project and run the following code to run your own instance:

```ts
import { createApiClientProxy } from '@scalar/api-client-proxy'

const { listen } = createApiClientProxy()

listen(5051, () => {
  console.log(`🥤 API Client Proxy listening on http://localhost:5051`)
})
```
