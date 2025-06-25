# Postman to OpenAPI Converter

[![Version](https://img.shields.io/npm/v/%40scalar/postman-to-openapi)](https://www.npmjs.com/package/@scalar/postman-to-openapi)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/postman-to-openapi)](https://www.npmjs.com/package/@scalar/postman-to-openapi)
[![License](https://img.shields.io/npm/l/%40scalar%2Fpostman-to-openapi)](https://www.npmjs.com/package/@scalar/postman-to-openapi)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Convert Postman collections to [the open standard OpenAPI](https://github.com/OAI/OpenAPI-Specification). Free the postman!

## Installation

```bash
npm install @scalar/postman-to-openapi
```

## Usage

```ts
import { convert } from '@scalar/postman-to-openapi'

// Free the postman!
const result = await convert(myPostmanCollection)

console.log(result)
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## Thank you!

This package is based on the existing [`postman-to-openapi`](https://github.com/joolfe/postman-to-openapi) by [@joolfe](https://github.com/joolfe). We update the code and adapted it to our use case. You might consider our package the modern successor.
