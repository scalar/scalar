# Scalar Void Server

[![Version](https://img.shields.io/npm/v/%40scalar/void-server)](https://www.npmjs.com/package/@scalar/void-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/void-server)](https://www.npmjs.com/package/@scalar/void-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fvoid-server)](https://www.npmjs.com/package/@scalar/void-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

An Hono server that responds with the request data. Kind of a mirror for HTTP requests.

It's running on <https://void.scalar.com>, feel free to use it.

## Examples

- https://void.scalar.com/
- https://void.scalar.com/404
- https://void.scalar.com/foobar.html
- https://void.scalar.com/foobar.json
- https://void.scalar.com/foobar.xml
- https://void.scalar.com/foobar.zip
- https://void.scalar.com/?foo=bar&foo=rab

## Installation

```bash
npm add @scalar/void-server
```

## Usage

```ts
import { serve } from '@hono/node-server'
import { createVoidServer } from '@scalar/void-server'

// Create the server instance
const app = await createVoidServer()

// Start the server
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`)
  },
)
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/packages/void-server/LICENSE).
