# Scalar OpenAPI Upgrader

<div class="flex gap-2">
  <a href="https://www.npmjs.com/@scalar/openapi-upgrader">
    <img src="https://img.shields.io/npm/v/@scalar/openapi-upgrader" alt="Version">
  </a>
  <a href="https://www.npmjs.com/@scalar/openapi-upgrader">
    <img src="https://img.shields.io/npm/dm/@scalar/openapi-upgrader" alt="Downloads">
  </a>
  <a href="https://www.npmjs.com/package/@scalar/openapi-upgrader">
    <img src="https://img.shields.io/npm/l/@scalar/openapi-upgrader" alt="License">
  </a>
  <a href="https://discord.gg/scalar">
    <img src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2" alt="Discord">
  </a>
</div>

Upgrade all your OpenAPI documents to the latest and greatest version.

## Scalar CLI

```bash
# Convert Swagger 2.0 to OpenAPI 3.1
npx @scalar/cli document upgrade swagger.json --output openapi.json
```

## TypeScript Package

You can use the package in your Node.js/JavaScript/TypeScript projects:

```bash
npm add @scalar/openapi-upgrader
```

### Usage

```typescript
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

```typescript
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

### From Swagger 2.0 to OpenAPI 3.0

```typescript
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

```typescript
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

```typescript
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
