# Scalar Proxy Server

[![Version](https://img.shields.io/npm/v/%40scalar/proxy-server)](https://www.npmjs.com/package/@scalar/proxy-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/proxy-server)](https://www.npmjs.com/package/@scalar/proxy-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fproxy-server)](https://www.npmjs.com/package/@scalar/proxy-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

The Scalar Proxy Server is a simple proxy which makes requests from a server to avoid CORS issues.
Works well with the Scalar API Client.

## Installation

```bash
npm install @scalar/server-proxy
```

## Usage

We will host the Scalar Proxy Server as a cloudflare worker for anyone to use.
To use it, just hit pass the `url` parameter wherever it is hosted:
`http://localhost:5051/?url=https://google.ca`

If you would like to host it yourself, just import `proxyServer` and pass in a `Request` object
to the fetch method as seen below:

## Bun

We have a built in bun server in this repo, you can just `pnpm dev:bun` inside of this package.
Otherwise you can add it to your own server with:

```ts
import proxyServer '@scalar/proxy-server'

const server = Bun.serve(proxyServer);
```

## Express

```ts

```

## Fastify

```ts

```

## Hono

```ts
import proxyServer from '@scalar/proxy-server'
import { Hono } from 'hono'

const app = new Hono()

app.all('/', (c) => proxyServer.fetch(c.req.raw))

export default app
```
