# Scalar Echo Server

[![Version](https://img.shields.io/npm/v/%40scalar/echo-server)](https://www.npmjs.com/package/@scalar/echo-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/echo-server)](https://www.npmjs.com/package/@scalar/echo-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fecho-server)](https://www.npmjs.com/package/@scalar/echo-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

The Scalar Echo Server is an Express server, which replies with the request data. Works well with the Scalar API Client.

## Installation

```bash
npm install @scalar/echo-server
```

## Usage

Create a new Node.js project and run the following code to run your own instance:

```ts
import { createEchoServer } from '@scalar/echo-server'

const { listen } = createEchoServer()

listen(5052, () => {
  console.log(`🔁 Echo Server listening on http://localhost:5052`)
})
```

## Example

No matter which route you hit, the response contains all the request data and looks like that:

```json
{
  "headers": {
    "host": "localhost:5052",
    "connection": "keep-alive",
    "accept": "*/*",
    "accept-language": "*",
    "sec-fetch-mode": "no-cors",
    "user-agent": "undici",
    "cache-control": "max-age=0",
    "accept-encoding": "gzip, deflate",
    "content-length": "0"
  },
  "cookies": {},
  "method": "GET",
  "path": "/foo",
  "query": {
    "foo": "bar"
  },
  "body": {}
}
```
