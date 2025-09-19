# Scalar OpenAPI Upgrader

[![Version](https://img.shields.io/npm/v/@scalar/openapi-upgrader)](https://www.npmjs.com/package/@scalar/openapi-upgrader)
[![Downloads](https://img.shields.io/npm/dm/@scalar/openapi-upgrader)](https://www.npmjs.com/package/@scalar/openapi-upgrader)
[![License](https://img.shields.io/npm/l/@scalar/openapi-upgrader)](https://www.npmjs.com/package/@scalar/openapi-upgrader)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Upgrade all your OpenAPI documents to the latest and greatest version

## Installation

```bash
npm add @scalar/openapi-upgrader
```

## Usage

```ts
import { upgrade } from '@scalar/openapi-upgrader'

const document = upgrade({
  swagger: '2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
})

console.log(document.openapi)
// Output: 3.1.1
```

### Experimental: Upgrade to OpenAPI 3.2

```ts
import { upgrade } from '@scalar/openapi-upgrader'

const OPENAPI_DOCUMENT = {
  swagger: '2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}

// We need to explicitly pass '3.2' to upgrade to OpenAPI 3.2
const document = upgrade(OPENAPI_DOCUMENT, '3.2')

console.log(document.openapi)
// Output: 3.2.0
```

### CLI

```bash
npx @scalar/cli document upgrade swagger.json --output openapi.json
```

### From Swagger 2.0 to OpenAPI 3.0

```ts
import { upgradeFromTwoToThree } from '@scalar/openapi-upgrader/2.0-to-3.0'

const document = upgradeFromTwoToThree({
  swagger: '2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
})

console.log(document.openapi)
// Output: 3.0.4
```

### From OpenAPI 3.0 to OpenAPI 3.1

```ts
import { upgradeFromThreeToThreeOne } from '@scalar/openapi-upgrader/3.0-to-3.1'

const document = upgradeFromThreeToThreeOne({
  openapi: '3.0.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
})

console.log(document.openapi)
// Output: 3.1.1
```

### From OpenAPI 3.1 to OpenAPI 3.2

```ts
import { upgradeFromThreeOneToThreeTwo } from '@scalar/openapi-upgrader/3.1-to-3.2'

const document = upgradeFromThreeOneToThreeTwo({
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
})

console.log(document.openapi)
// Output: 3.2.0
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
