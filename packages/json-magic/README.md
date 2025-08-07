# json-magic

[![Version](https://img.shields.io/npm/v/%40scalar/json-magic)](https://www.npmjs.com/package/@scalar/json-magic)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/json-magic)](https://www.npmjs.com/package/@scalar/json-magic)
[![License](https://img.shields.io/npm/l/%40scalar%2Fjson-magic)](https://www.npmjs.com/package/@scalar/json-magic)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)


A collection of utilities for working with JSON objects, including diffing, conflict resolution, bundling and more.

## bundle

Bundle external references in a json object

### Quick start

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle({
 $ref: 'http://example.com/document.json' 
}, {
  plugins: [fetchUrls()],
  treeShake: false,
})

// get the bundled json object
console.log(result)
```

#### Plugins

If you are on a browser environment import plugins from `@scalar/json-magic/bundle/plugins/browser` while if you are on a node environment you can import from `@scalar/json-magic/bundle/plugins/node`

##### fetchUrls
This plugins handles all external urls. It works for both node.js and browser environment

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const document = {
  openapi: '3.1.0',
  info: { title: 'Bundled API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      User: { $ref: 'https://example.com/user-schema.json#' }
    }
  }
}

// This will bundle all external documents and turn all references from external into internal
await bundle(document, {
  plugins: [fetchUrls()],
  treeShake: true  // <------  This flag will try to remove any unused part of the external document
})

console.log(document)
```

###### Limiting the number of concurrent requests

```ts
await bundle(document, {
  plugins: [
    fetchUrls({
      limit: 10, // it should run at most 10 requests at the same time
    }),
  ],
  treeShake: false
})

```

###### Custom headers
To pass custom headers to requests for specific domains you can configure the fetch plugin like the example

```ts
await bundle(
  document,
  {
    plugins: [
      fetchUrls({
        // Pass custom headers
        // The header will only be attached to the list of domains
        headers: [
          {
            domains: ['example.com'],
            headers: {
              'Authorization': 'Bearer <TOKEN>'
            }
          }
        ]
      }),
      readFiles(),
    ],
    treeShake: false
  },
)
```

###### Custom fetch function
For advanced use cases like proxying requests or implementing custom network logic, you can provide your own fetch implementation. This allows you to handle things like CORS restrictions, custom authentication flows, or request/response transformations.

```ts
await bundle(
  document,
  {
    plugins: [
      fetchUrls({
        // Custom fetcher function
        fetch: async (input, init) => {
          console.log('Custom fetch logic')
          return fetch(input, init)
        },
      })
      readFiles(),
    ],
    treeShake: false
  },
)
```

###### Bundle from remote url

```ts
const result = await bundle(
  'https://example.com/openapi.json',
  {
    plugins: [
      fetchUrls(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

##### readFiles
This plugins handles local files. Only works on node.js environment

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'

const document = {
  openapi: '3.1.0',
  info: { title: 'Bundled API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      User: { $ref: './user-schema.json#' }
    }
  }
}

// This will bundle all external documents and turn all references from external into internal
await bundle(document, {
  plugins: [readFiles()],
  treeShake: false
})

console.log(document)
```

###### Bundle from local file
You can pass the file path directly but make sure to have the correct plugins to handle reading from the local files

```ts
const result = await bundle(
  './input.json',
  {
    plugins: [
      readFiles(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

##### parseJson

You can pass raw json string as input
```ts
import { bundle } from '@scalar/json-magic/bundle'
import { parseJson } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle(
  '{ "openapi": "3.1.1" }',
  {
    plugins: [
      parseJson(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

##### parseYaml

You can pass raw yaml string as input
```ts
import { bundle } from '@scalar/json-magic/bundle'
import { parseYaml } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle(
  'openapi: "3.1.1"\n',
  {
    plugins: [
      parseYaml(),
    ],
    treeShake: false
  },
)

// Bundled document
console.log(result)
```

#### Bundler Options

##### depth

The `depth` option controls how deeply the bundler will resolve `$ref` references. When you set `depth` to a number, the bundler will only follow references up to that level of nesting. This is useful for creating partial bundles or limiting resource usage.

**Note:** When using `depth`, the resulting bundle may not be fully self-contained—some nested references deeper than the specified depth may remain unresolved. If you use `depth` together with the `visitedNodes` option, be aware that parent nodes may be marked as visited even if their child references have not been fully resolved yet. Use this option with care if you require a complete bundle.

```ts
import { bundle } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins-browser'

await bundle(input, {
  plugins: [fetchUrls()],
  treeShake: false,
  depth: 2,
})
```


## dereference

Dereference all `$ref` pointers in a JSON object, resolving both internal and external references.

The `dereference` function can operate in two modes:

- **Synchronous (`sync: true`)**: Only internal references (within the same object) are resolved. The result is wrapped in a magic proxy for reactive access. No network requests are made.
- **Asynchronous (`sync: false` or omitted)**: Both internal and external references (e.g., URLs) are resolved. The function returns a Promise that resolves to the fully dereferenced object, also wrapped in a magic proxy.

### Options

- `sync` (`boolean`):  
  - If `true`, resolves only internal references synchronously.
  - If `false` (default), resolves both internal and external references asynchronously and returns a Promise.

The result is an object with a `success` property. If dereferencing fails (e.g., due to unresolved external references), the result will include an `errors` array describing the issues encountered.

```ts
import { dereference } from '@scalar/json-magic/dereference'

const result = dereference({ a: 'hello', b: { $ref: '#/a' } }, { sync: true })

// Resolve internal references synchronously
console.log(result)
```

To resolve also external references you need to set `sync: false`

```ts
import { dereference } from '@scalar/json-magic/dereference'

const result = await dereference({ a: 'hello', b: { $ref: 'http://example.com/document.json#/somepath' } }, { sync: false })

// Result with all internal and external references resolved
console.log(result)
```

## diff

This package provides a way to compare two json objects and get the differences, resolve conflicts and return conflicts that need to be resolved manually.

### Quickstart


```ts
import { apply, diff, merge } from '@scalar/json-magic/diff'

const baseObject = {
  openapi: '3.0.0',
  info: {
    title: 'Simple API',
    description: 'A small OpenAPI specification example',
    version: '1.0.0',
  },
}

const objectV1 = {
  openapi: '3.0.0',
  info: {
    title: 'Simple API',
    description: 'A small OpenAPI specification example',
    version: '1.0.0',
  },
  change: 'This is a new property',
}

const objectV2 = {
  openapi: '3.0.0',
  info: {
    title: 'Simple API',
    description: 'A small OpenAPI specification example',
    version: '1.0.1',
  },
}

// Merge the changes of both versions with the same parent object
const { diffs, conflicts } = merge(
  diff(baseObject, objectV1),
  diff(baseObject, objectV2),
)

// Apply changes from v1 and v2 to the parent object to get the final object
const finalDocument = apply(baseObject, diffs)
```


## magic-proxy

A javascript proxy which resolves internal references when accessing a property

### Quick start

```ts
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'

const result = createMagicProxy({
  a: 'hello',
  b: {
    $ref: '#/a'
  }
})

/**
 * Output:
 * {
 *  a: 'hello',
 *  b: {
 *    $ref: '#/a',
 *    '$ref-value': 'hello'
 *  }
 * }
 */
console.log(result)

const rawObject = getRaw(result)
/**
 * {
 *  a: 'hello',
 *  b: {
 *    $ref: '#/a'
 *  }
 * }
 */
console.log(rawObject)
```