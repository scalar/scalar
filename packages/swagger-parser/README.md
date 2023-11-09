# Scalar Swagger Parser

[![Version](https://img.shields.io/npm/v/%40scalar/swagger-parser)](https://www.npmjs.com/package/@scalar/swagger-parser)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/swagger-parser)](https://www.npmjs.com/package/@scalar/swagger-parser)
[![License](https://img.shields.io/npm/l/%40scalar%2Fswagger-parser)](https://www.npmjs.com/package/@scalar/swagger-parser)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/8HeZcRGPFS)

## Installation

```bash
npm install @scalar/swagger-parser
```

## Usage

```js
import { parse } from '@scalar/swagger-parser'

parse(value)
  .then((spec) => {
    console.log(spec)
  })
  .catch((error) => {
    console.error(error)
  })
```
