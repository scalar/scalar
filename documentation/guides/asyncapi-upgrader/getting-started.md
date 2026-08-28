# Scalar AsyncAPI Upgrader

<div class="flex gap-2">
  <a href="https://www.npmjs.com/@scalar/asyncapi-upgrader">
    <img src="https://img.shields.io/npm/v/@scalar/asyncapi-upgrader" alt="Version">
  </a>
  <a href="https://www.npmjs.com/@scalar/asyncapi-upgrader">
    <img src="https://img.shields.io/npm/dm/@scalar/asyncapi-upgrader" alt="Downloads">
  </a>
  <a href="https://www.npmjs.com/package/@scalar/asyncapi-upgrader">
    <img src="https://img.shields.io/npm/l/@scalar/asyncapi-upgrader" alt="License">
  </a>
  <a href="https://discord.gg/scalar">
    <img src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2" alt="Discord">
  </a>
</div>

Upgrade all your AsyncAPI documents to the latest and greatest version.

## TypeScript Package

You can use the package in your Node.js/JavaScript/TypeScript projects:

```bash
npm add @scalar/asyncapi-upgrader
```

### Usage

The `upgrade` function migrates any AsyncAPI 1.x, 2.x, or 3.0 document all the way to the latest version (3.1.0) in a single call.

```typescript
import { upgrade } from '@scalar/asyncapi-upgrader'

const document = upgrade({
  asyncapi: '2.6.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  channels: {},
})

console.log(document.asyncapi)
// Output: 3.1.0
```

Documents without an `asyncapi` field are returned untouched, so it is safe to run `upgrade` on documents that might already be up to date.

### From AsyncAPI 1.x to 2.6

```typescript
import { upgradeFromOneToTwo } from '@scalar/asyncapi-upgrader/1.2-to-2.6'

const document = upgradeFromOneToTwo({
  asyncapi: '1.2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
})

console.log(document.asyncapi)
// Output: 2.6.0
```

### From AsyncAPI 2.6 to 3.0

```typescript
import { upgradeFromTwoToThree } from '@scalar/asyncapi-upgrader/2.6-to-3.0'

const document = upgradeFromTwoToThree({
  asyncapi: '2.6.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  channels: {},
})

console.log(document.asyncapi)
// Output: 3.0.0
```

### From AsyncAPI 3.0 to 3.1

```typescript
import { upgradeFromThreeToThreeOne } from '@scalar/asyncapi-upgrader/3.0-to-3.1'

const document = upgradeFromThreeToThreeOne({
  asyncapi: '3.0.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  channels: {},
})

console.log(document.asyncapi)
// Output: 3.1.0
```
