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

To use it, just hit pass the `url` query parameter, everything else will be forwarded (headers, body etc).
`https://proxy.scalar.com?url=https://scalar.com`

The URL must be the first and only query parameter on the base URL, so you can add query params to to the url.
`https://proxy.scalar.com?url=https://scalar.com?other=queries`

We will host the Scalar Proxy Server as a cloudflare worker for anyone to use at <https://proxy.scalar.com>
If you would like to host it yourself, just import `proxyServer` and pass in a `Request` object.

Most the following examples can also be found in the examples folder.

## Bun

We have a built in bun server in this repo, you can just `pnpm dev:bun` inside of this package.
Otherwise you can add it to your own server with:

```ts
import proxyServer '@scalar/proxy-server'

const server = Bun.serve(proxyServer);
```

## Express

The express proxy just requires you to write the response back out. However, if you start getting
`ERR_INVALID_STATE` or `Content Encoding Error` errors your server might not be able to handle the
encoding. In that case just include the optional headers line below.

```ts
import { proxyFetch } from '@scalar/proxy-server'

app.all('/', (req, res) => {
  req.headers['accept-encoding'] = '' // Optional headers line for encoding

  proxyFetch(req).then(({ body, headers }) => {
    body?.pipeTo(
      new WritableStream({
        start() {
          headers.forEach((v, n) => res.setHeader(n, v))
        },
        write(chunk) {
          res.write(chunk)
        },
        close() {
          res.end()
        },
      }),
    )
  })
})
```

## Fastify

The fastify proxy can be as simple as this.

```ts
import { proxyFetch } from '@scalar/proxy-server'

fastify.all('/', proxyFetch)
```

However, if you start getting `ERR_INVALID_STATE` or `Content Encoding Error` errors your server
might not be able to handle the encoding. A simple workaround is just to remove the `accept-encoding`
header like so:

```ts
import { proxyFetch } from '@scalar/proxy-server'

fastify.all('/', (req, reply) => {
  req.headers = { 'accept-encoding': '' }
  return proxyFetch(req)
})
```

## Hono

```ts
import { proxyFetch } from '@scalar/proxy-server'
import { Hono } from 'hono'

const app = new Hono()

app.all('/', (c) => proxyFetch(c.req.raw))

export default app
```

## Nextjs

For Next.js just create this handly handler and export it for every method you need. Once again
removing the encoding header is optional.

```ts
import { proxyFetch } from '@scalar/proxy-server'

export const handler = (request: Request) => {
  request.headers.set('accept-encoding', '') // Optionally remove encoding header
  return proxyFetch(request)
}

export const GET = handler
export const HEAD = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
```

## Nuxt

```ts

```

## Platformatic

```ts

```
