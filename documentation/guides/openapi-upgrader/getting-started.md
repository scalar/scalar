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

#### Compatibility and errors

Upgrading to `3.2` returns a new document and leaves the input unchanged, including
when conversion fails. This applies to both `upgrade(input, '3.2')` and
`upgradeFromThreeOneToThreeTwo(input)` for OpenAPI 3.1 input. Excessive YAML alias
expansion is rejected before it can exhaust memory; use `$ref` for heavily shared
schemas.

The conversion:

- Migrates XML metadata only within Schema Objects, preserving examples, defaults,
  constants, enum values, and unrelated extension data.
- Removes both legacy XML flags when introducing `nodeType`.
- Adds native parent tags for unambiguous `x-tagGroups`. The extension is retained
  to preserve ordering and visibility in existing renderers. Groups with duplicate
  membership, naming conflicts (including operation-only tags), or existing parent relationships are left intact.
- Removes `allowReserved` from path and cookie parameters, where it was ignored in
  OpenAPI 3.1, so it does not unexpectedly affect serialization in OpenAPI 3.2.

Conversion walks the whole document and throws one `AggregateError` containing
all detected incompatibilities, with a JSON pointer for each issue that needs an
author's decision: repeated path or server variables, an optional
discriminator property without `defaultMapping`, or an unnamed inline XML element.
Resolve the reported issues in the original document and retry. The aggregate
message lists every issue; its `errors` array provides the individual errors. The upgrader does
not choose fallback schemas, XML element names, or replacement parameter names.

These checks are not a complete OpenAPI validator. External references are not
loaded, and requiredness is not inferred from ambiguous schema constraints.
Requiredness analysis stops when its work budget is exhausted and adds an explicit
analysis-truncated error, so an incomplete check cannot silently succeed.
Schemas with an explicit `jsonSchemaDialect` or `$schema` keep their dialect and
legacy XML metadata. References crossing schema resource boundaries are not used
to infer requiredness. Validate the resulting description with tooling that
supports its declared dialects and referenced documents.
