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
expansion is bounded; use `$ref` for heavily shared schemas.

OpenAPI 3.1 source versions must include a numeric patch component, such as `3.1.0`.
Malformed 3.1 declarations (`3.1`, `3.1.invalid`, or `3.1.0-rc1`) throw an error
instead of silently returning a document that still declares 3.1. Unrelated
versions passed to the direct 3.1-to-3.2 converter remain unchanged.

The immutable clone rejects JavaScript object cycles because they cannot be
represented in JSON. `$ref` cycles remain supported. It copies each occurrence
of a YAML alias independently so a schema migration cannot alter an example
sharing the same source object. To bound that amplification, it rejects copying
only when **both** limits are exceeded: 100,000 copied entries and ten times the
number of unique source entries encountered. An entry is an object or array plus
its property or element slots. These are allocation policy limits, not OpenAPI
validity rules: the fixed floor permits ordinary small aliases, while the ratio
limits disproportionate growth without imposing a maximum on large descriptions
that do not expand aliases. Cycles and excessive expansion throw ordinary `Error`
instances before compatibility analysis, leaving the input unchanged.

The conversion:

- Migrates XML metadata only within Schema Objects, preserving examples, defaults,
  constants, enum values, and unrelated extension data.
- Removes both legacy XML flags when introducing `nodeType`.
- Adds native parent tags for unambiguous `x-tagGroups`. The extension is retained
  to preserve ordering and visibility in existing renderers. Groups with duplicate
  membership, naming conflicts (including operation-only tags), or existing parent relationships are left intact.
- Removes `allowReserved` from path and cookie parameters, where it was ignored in
  OpenAPI 3.1, so it does not unexpectedly affect serialization in OpenAPI 3.2.

By default, conversion walks the whole document and throws one `UpgradeIncompatibilityError` (an `AggregateError` subclass) containing
all detected incompatibilities, with a JSON pointer for each issue that needs an
author's decision: conflicting XML `wrapped` and `attribute` flags, repeated path or server variables, an optional
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


#### Handling an unsuccessful upgrade

Both public upgrade entry points are synchronous. In the default strict mode,
errors propagate to the caller and no converted document is returned on failure. Catch the error at the
loading boundary and keep the original description available for correction:

```typescript
try {
  const converted = upgrade(input, '3.2')
  // Publish or store the converted description only after this succeeds.
  console.log(converted)
} catch (error) {
  const issues = error instanceof AggregateError ? error.errors : [error]
  for (const issue of issues) {
    console.error(issue instanceof Error ? issue.message : issue)
  }
  // The input remains unchanged; report these issues before retrying.
}
```

#### Collecting diagnostics without failing a document load

Use `upgrade(input, '3.2', { onIncompatible: 'collect' })` to return a
`{ document, diagnostics }` result instead of throwing for compatibility issues:

```typescript
import { upgrade } from '@scalar/openapi-upgrader'

const input = {
  openapi: '3.1.2',
  info: { title: 'Pets', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        responses: {
          '200': {
            description: 'A pet',
            content: {
              'application/xml': {
                schema: { type: 'object', properties: { id: { type: 'integer' } } },
              },
            },
          },
        },
      },
    },
  },
}

const { document, diagnostics } = upgrade(input, '3.2', {
  onIncompatible: 'collect',
})

console.log(document.openapi)
// Output: 3.1.2
console.log(diagnostics.map((issue) => issue.message))
// Reports the unnamed inline XML schema at:
// #/paths/~1pets/get/responses/200/content/application~1xml/schema
```

When compatibility checks succeed, `document` is the upgraded OpenAPI 3.2
API description and `diagnostics` is an empty array. When compatibility issues
are detected, `diagnostics` contains every detected error with its JSON pointer,
and `document` is a complete OpenAPI 3.1 fallback. OpenAPI 3.1 input keeps its
original patch version; Swagger 2.0 and OpenAPI 3.0 input first convert to 3.1.
The fallback contains no partial 3.2 transformations and does not invent XML
names or discriminator defaults. The input remains unchanged, and the returned
document is an independent copy.

Collect mode reports the same compatibility issues as strict mode, including
analysis truncation. Malformed versions, cyclic objects, and excessive alias
expansion still throw ordinary errors. An empty diagnostics array means that no
migration incompatibility was detected; it does not certify full OpenAPI validity.

The `UpgradeOptions` and `UpgradeResult` types are exported from
`@scalar/openapi-upgrader`. The third argument is available when targeting `3.2`.
Omitting it, or using `{ onIncompatible: 'throw' }`, keeps the existing return type
and strict behavior. The direct `upgradeFromThreeOneToThreeTwo` entry point remains
strict; use `upgrade` to collect diagnostics.

The Markdown converter and mock server use collect mode, so compatible descriptions
upgrade to 3.2 and incompatible descriptions continue loading as 3.1. The workspace
store still targets 3.1 and does not run these compatibility checks. A caller moving
to 3.2 can choose collect mode to preserve existing descriptions while reporting
migration issues, or strict mode when a successful 3.2 migration is required.
