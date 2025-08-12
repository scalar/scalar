# Scalar Core

[![Version](https://img.shields.io/npm/v/%40scalar/core)](https://www.npmjs.com/package/@scalar/core)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/core)](https://www.npmjs.com/package/@scalar/core)
[![License](https://img.shields.io/npm/l/%40scalar%2Fcore)](https://www.npmjs.com/package/@scalar/core)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Shared libraries for our packages, specifically [@scalar/api-reference](https://npmjs.com/@scalar/api-reference) and [@scalar/api-client](https://www.npmjs.com/package/@scalar/api-client).


## Installation

```bash
npm install @scalar/core
```

## Usage

```ts
import { getHtmlDocument } from '@scalar/core/libs/html-rendering'

const html = getHtmlDocument({
  url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
})
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
