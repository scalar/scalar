# @scalar/json-magic

[![Version](https://img.shields.io/npm/v/%40scalar/json-magic)](https://www.npmjs.com/package/@scalar/json-magic)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/json-magic)](https://www.npmjs.com/package/@scalar/json-magic)
[![License](https://img.shields.io/npm/l/%40scalar%2Fjson-magic)](https://www.npmjs.com/package/@scalar/json-magic)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A collection of utilities for working with JSON objects, including diffing, conflict resolution, bundling and more.

---

Scalar is an open-source API platform for teams who want beautiful developer interfaces without vendor lock-in.

- **[API References](https://scalar.com/products/api-references/getting-started)** — Interactive API documentation from OpenAPI and AsyncAPI specs.
- **[Developer Docs](https://scalar.com/products/docs/getting-started)** — Write in Markdown/MDX, generate API references, sync with two-way Git.
- **[SDK Generator](https://scalar.com/products/sdk-generator/getting-started)** — Type-safe SDKs and CLIs in TypeScript, Python, Go, PHP, Java, and Ruby.
- **[API Client](https://scalar.com/products/api-client/getting-started)** — Open-source, offline-first Postman alternative built on OpenAPI.

20M+ monthly npm installs · 15,500+ GitHub stars · MIT licensed · [scalar.com](https://scalar.com)

---

## Installation

```bash
npm add @scalar/json-magic
```

## Entry points

There is no root export. Every module is imported from its own entry point, so you only pay for what you use.

| Entry point | Exports |
| --- | --- |
| `@scalar/json-magic/bundle` | `bundle`, `isLocalRef`, `prefixInternalRef`, `prefixInternalRefRecursive`, `resolveAndCopyReferences`, plus the `Plugin`, `LoaderPlugin`, `LifecyclePlugin` and `ResolveResult` types |
| `@scalar/json-magic/bundle/plugins/browser` | `fetchUrls`, `parseJson`, `parseYaml` |
| `@scalar/json-magic/bundle/plugins/node` | `fetchUrls`, `parseJson`, `parseYaml`, `readFiles` |
| `@scalar/json-magic/bundle/value-generator` | `getHash`, `generateUniqueValue`, `uniqueValueGeneratorFactory` |
| `@scalar/json-magic/dereference` | `dereference` |
| `@scalar/json-magic/diff` | `diff`, `merge`, `apply`, the `Difference` type |
| `@scalar/json-magic/magic-proxy` | `createMagicProxy`, `getRaw` |
| `@scalar/json-magic/helpers/*` | Small standalone helpers, see [Helpers](#helpers) |

## Which module do I need?

| I want to … | Use |
| --- | --- |
| Pull external `$ref` documents into a single self-contained document | [`bundle`](#bundle) |
| Read through `$ref` pointers without rewriting the document | [`magic-proxy`](#magic-proxy) |
| Resolve every `$ref`, internal and external, in one call | [`dereference`](#dereference) |
| Compare two documents and merge concurrent edits | [`diff`](#diff) |

## bundle

`bundle` walks a JSON object, resolves every external `$ref` (URLs, local files, or anything a custom loader plugin can handle) and embeds the result into the document itself. The original `$ref` values are rewritten to point at the embedded copies, so the output is a single self-contained document.

External documents are stored under the `x-ext` key, and the mapping between the generated keys and their original URLs is stored under `x-ext-urls`. Both keys are configurable, see [Options](#options).

### Quick start

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle(
  { $ref: 'http://example.com/document.json' },
  {
    plugins: [fetchUrls()],
    treeShake: false,
  },
)

// The bundled document
console.log(result)
```

When the input is an object it is modified in place, and the same object is returned. When the input is a string it is resolved with the given plugins first.

### Loaders

A loader plugin teaches the bundler how to read one kind of reference. Import loaders from `@scalar/json-magic/bundle/plugins/browser` in the browser, or from `@scalar/json-magic/bundle/plugins/node` in Node.js. The Node entry point is a superset: it adds `readFiles`, which needs filesystem access.

| Loader | Handles | Available in |
| --- | --- | --- |
| `fetchUrls` | `http://` and `https://` references | browser, node |
| `readFiles` | Local file paths | node |
| `parseJson` | A raw JSON string passed as the input | browser, node |
| `parseYaml` | A raw YAML string passed as the input | browser, node |

You can combine as many loaders as you need. The first one whose `validate` returns `true` wins.

#### fetchUrls

Resolves remote documents over HTTP. It works in both Node.js and the browser.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const document = {
  openapi: '3.1.0',
  info: { title: 'Bundled API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      User: { $ref: 'https://example.com/user-schema.json#' },
    },
  },
}

// This bundles all external documents and turns external references into internal ones
await bundle(document, {
  plugins: [fetchUrls()],
  // Removes the parts of the external documents that are not referenced
  treeShake: true,
})

console.log(document)
```

##### Limiting the number of concurrent requests

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

await bundle(document, {
  plugins: [
    fetchUrls({
      // Run at most 10 requests at the same time
      limit: 10,
    }),
  ],
  treeShake: false,
})
```

##### Custom headers

Headers are matched against the host of the reference, so a token is only ever sent to the domains you list.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

await bundle(document, {
  plugins: [
    fetchUrls({
      headers: [
        {
          domains: ['example.com'],
          headers: {
            Authorization: 'Bearer <TOKEN>',
          },
        },
      ],
    }),
  ],
  treeShake: false,
})
```

##### Custom fetch function

For advanced use cases like proxying requests or implementing custom network logic, you can provide your own fetch implementation. This allows you to handle things like CORS restrictions, custom authentication flows, or request and response transformations.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

await bundle(document, {
  plugins: [
    fetchUrls({
      fetch: async (input, init) => {
        console.log('Custom fetch logic')
        return fetch(input, init)
      },
    }),
  ],
  treeShake: false,
})
```

##### Bundle from a remote URL

The input itself can be a URL, as long as a loader can handle it.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle('https://example.com/openapi.json', {
  plugins: [fetchUrls()],
  treeShake: false,
})

// The bundled document
console.log(result)
```

#### readFiles

Resolves local files. This loader only works in a Node.js environment.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'

const document = {
  openapi: '3.1.0',
  info: { title: 'Bundled API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      User: { $ref: './user-schema.json#' },
    },
  },
}

await bundle(document, {
  plugins: [readFiles()],
  treeShake: false,
})

console.log(document)
```

##### Bundle from a local file

You can pass the file path directly, as long as `readFiles` is registered to read it.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'

const result = await bundle('./input.json', {
  plugins: [readFiles()],
  treeShake: false,
})

// The bundled document
console.log(result)
```

A document that mixes remote and local references needs both loaders:

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, readFiles } from '@scalar/json-magic/bundle/plugins/node'

await bundle('./openapi.json', {
  plugins: [readFiles(), fetchUrls()],
  treeShake: false,
})
```

#### parseJson

Accepts a raw JSON string as the input.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { parseJson } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle('{ "openapi": "3.1.1" }', {
  plugins: [parseJson()],
  treeShake: false,
})

// The bundled document
console.log(result)
```

#### parseYaml

Accepts a raw YAML string as the input.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { parseYaml } from '@scalar/json-magic/bundle/plugins/browser'

const result = await bundle('openapi: "3.1.1"\n', {
  plugins: [parseYaml()],
  treeShake: false,
})

// The bundled document
console.log(result)
```

#### Writing a custom loader

A loader is a plain object, so you can resolve references from anywhere: a database, an in-memory map, or a custom protocol.

```ts
import { bundle, type LoaderPlugin } from '@scalar/json-magic/bundle'

const workspaceFiles: LoaderPlugin = {
  type: 'loader',
  validate: (value) => value.startsWith('workspace:'),
  exec: async (value) => {
    const raw = await readFromWorkspace(value.replace('workspace:', ''))

    if (raw === undefined) {
      return { ok: false }
    }

    return { ok: true, data: JSON.parse(raw), raw }
  },
}

await bundle(document, {
  plugins: [workspaceFiles],
  treeShake: false,
})
```

`exec` returns `{ ok: true, data, raw }` on success and `{ ok: false }` on failure. A failed resolution is reported through the `onResolveError` hook and logged as a warning, it does not throw.

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `plugins` | `Plugin[]` | — | Loader and lifecycle plugins used during bundling. Required. |
| `treeShake` | `boolean` | — | Only keep the parts of external documents that are actually referenced. Required. |
| `depth` | `number` | unlimited | How deeply nested `$ref` pointers are followed. See the note below. |
| `root` | `UnknownObject` | the input | Base document to write external documents into, used for partial bundling. |
| `origin` | `string` | the input | Base path used to resolve relative references. |
| `cache` | `Map<string, Promise<ResolveResult>>` | new map | Cache of in-flight resolutions, reused across `bundle` calls to avoid refetching. |
| `visitedNodes` | `Set<unknown>` | new set | Nodes that have already been bundled, used to avoid re-bundling during partial bundles. |
| `urlMap` | `boolean` | `false` | Keep the mapping of generated keys to their original URLs in the output. |
| `externalDocumentsKey` | `string` | `'x-ext'` | Key that holds the bundled external documents. |
| `externalDocumentsMappingsKey` | `string` | `'x-ext-urls'` | Key that holds the mapping between generated keys and original URLs. |
| `compress` | `(value: string) => string \| Promise<string>` | hash | Function used to shorten URLs and file paths into document keys. |
| `hooks` | `object` | — | Lifecycle hooks, see [Hooks](#hooks). |

#### depth

The `depth` option controls how deeply the bundler resolves `$ref` references. When you set `depth` to a number, the bundler only follows references up to that level of nesting. This is useful for creating partial bundles or limiting resource usage.

**Note:** When using `depth`, the resulting bundle may not be fully self-contained, since nested references deeper than the given depth stay unresolved. If you use `depth` together with `visitedNodes`, be aware that parent nodes may be marked as visited even if their child references have not been fully resolved yet. Use this option with care if you require a complete bundle.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

await bundle(input, {
  plugins: [fetchUrls()],
  treeShake: false,
  depth: 2,
})
```

#### externalDocumentsKey

The `externalDocumentsKey` option controls the key used to store external references. This key contains all bundled external documents, which keeps a clean separation between the main document and its bundled references. **Defaults** to `x-ext`.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

await bundle(input, {
  plugins: [fetchUrls()],
  treeShake: false,
  externalDocumentsKey: 'x-external-docs',
})
```

#### externalDocumentsMappingsKey

The `externalDocumentsMappingsKey` option controls the key used to maintain a mapping between generated keys and their original URLs. This mapping is essential for tracking the source of bundled references. It is removed from the output of a full bundle unless `urlMap` is enabled. **Defaults** to `x-ext-urls`.

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

await bundle(input, {
  plugins: [fetchUrls()],
  treeShake: false,
  urlMap: true,
  externalDocumentsMappingsKey: 'x-external-urls',
})
```

### Hooks

Hooks let you observe and extend the bundling process, which is handy for progress reporting and error tracking.

| Hook | Called when |
| --- | --- |
| `onResolveStart` | The bundler starts resolving a `$ref` |
| `onResolveSuccess` | A `$ref` was resolved successfully |
| `onResolveError` | A `$ref` could not be resolved |
| `onBeforeNodeProcess` | Before a node is processed, may be async |
| `onAfterNodeProcess` | After a node is processed, may be async |

```ts
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const errors: string[] = []

await bundle(document, {
  plugins: [fetchUrls()],
  treeShake: true,
  hooks: {
    onResolveStart: (node) => console.log('Resolving:', node.$ref),
    onResolveSuccess: (node) => console.log('Resolved:', node.$ref),
    onResolveError: (node) => errors.push(`Failed to resolve ${node.$ref}`),
  },
})
```

The same hooks can be shipped as a reusable lifecycle plugin, which is then passed alongside the loaders:

```ts
import { bundle, type LifecyclePlugin } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'

const logProgress: LifecyclePlugin = {
  type: 'lifecycle',
  onResolveSuccess: (node) => console.log('Resolved:', node.$ref),
}

await bundle(document, {
  plugins: [fetchUrls(), logProgress],
  treeShake: false,
})
```

## dereference

`dereference` resolves the `$ref` pointers of a document and returns the result wrapped in a [magic proxy](#magic-proxy), so referenced values are read through the `$ref-value` property.

It works in two modes:

- **Synchronous (`sync: true`)**: only internal references are resolved, no network requests are made, and the result is returned directly.
- **Asynchronous (`sync: false`, the default)**: external references are bundled into the document first, so both internal and external references resolve. A Promise is returned.

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `sync` | `boolean` | `false` | Resolve internal references only, without returning a Promise. |
| `plugins` | `Plugin[]` | `[fetchUrls()]` | Loaders used to resolve external references in async mode. |

The result is an object with a `success` property. On success it carries the dereferenced `data`, and on failure it carries an `errors` array describing the references that could not be resolved.

```ts
import { dereference } from '@scalar/json-magic/dereference'

const result = dereference({ a: 'hello', b: { $ref: '#/a' } }, { sync: true })

if (result.success) {
  // 'hello'
  console.log(result.data.b['$ref-value'])
}
```

To resolve external references as well, drop `sync` (or set it to `false`) and await the result.

```ts
import { dereference } from '@scalar/json-magic/dereference'

const result = await dereference({
  a: 'hello',
  b: { $ref: 'http://example.com/document.json#/somepath' },
})

if (result.success) {
  console.log(result.data)
} else {
  console.error(result.errors)
}
```

To resolve references from somewhere other than HTTP, pass your own loaders:

```ts
import { dereference } from '@scalar/json-magic/dereference'
import { fetchUrls, readFiles } from '@scalar/json-magic/bundle/plugins/node'

const result = await dereference(document, {
  plugins: [readFiles(), fetchUrls()],
})
```

## diff

Compare two JSON objects, merge changes made in parallel, and surface the conflicts that need to be resolved manually.

| Function | Description |
| --- | --- |
| `diff(base, updated)` | Returns the list of `add`, `update` and `delete` changes that turn `base` into `updated` |
| `merge(diffA, diffB)` | Combines two changesets made against the same base into `{ diffs, conflicts }` |
| `apply(base, diffs)` | Applies a changeset to a document and returns it |

These three functions work on the documents themselves, not on copies of them. `apply` mutates the document it is given, `merge` merges one changeset into the entries of the other, and the changes a diff carries are live references into the documents that were compared. That means an applied document keeps sharing subtrees with the document it was diffed against, and a merge writes into the document behind its second changeset. Deep clone the documents before diffing them whenever you need the originals to stay untouched — cloning only the document you apply to is not enough.

`apply` throws an `InvalidChangesDetectedError` when a change points at a path that does not exist, when a change targets the document itself (an empty path, which a diff produces whenever the two documents differ at the root), and when a path reaches the prototype chain through `__proto__`, `constructor` or `prototype`.

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
const { diffs, conflicts } = merge(diff(baseObject, objectV1), diff(baseObject, objectV2))

// Apply changes from v1 and v2 to the parent object to get the final object
const finalDocument = apply(baseObject, diffs)
```

### Conflicts

`merge` only returns the changes it can combine safely. When both sides touch the same path, the pair is returned in `conflicts` for you to resolve, and it is left out of `diffs`.

```ts
import { diff, merge } from '@scalar/json-magic/diff'

const { diffs, conflicts } = merge(diff(base, mine), diff(base, theirs))

for (const [mineChanges, theirChanges] of conflicts) {
  // Decide which side wins, then push the winner onto diffs
  diffs.push(...mineChanges)
}
```

## magic-proxy

A JavaScript proxy that resolves internal references as you access properties. Nothing is copied or rewritten: the underlying document keeps its `$ref` pointers, and referenced values are read on demand through the virtual `$ref-value` property. Resolved values are cached, and proxies are stable for the same target object, which makes it safe to use with reactive frameworks like Vue.

### Quick start

```ts
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'

const result = createMagicProxy({
  a: 'hello',
  b: {
    $ref: '#/a',
  },
})

// 'hello', resolved on access
console.log(result.b['$ref-value'])

// '#/a', the original pointer is still there
console.log(result.b.$ref)

/**
 * getRaw returns the untouched object:
 * {
 *   a: 'hello',
 *   b: {
 *     $ref: '#/a'
 *   }
 * }
 */
const rawObject = getRaw(result)
console.log(rawObject)
```

Deeply nested values are proxied too, so `$ref-value` works at any depth. Writes pass through to the underlying object, and writing to `$ref-value` updates the value the reference points at.

Properties prefixed with `__scalar_` are treated as internal: they read as `undefined`, they are left out of `Object.keys`, and `in` checks return `false`. Pass `{ showInternal: true }` to expose them.

```ts
const proxy = createMagicProxy({ __scalar_meta: 'hidden' }, { showInternal: true })

// 'hidden'
console.log(proxy.__scalar_meta)
```

## Helpers

Standalone helpers, each with its own entry point.

| Helper | Description |
| --- | --- |
| `@scalar/json-magic/helpers/escape-json-pointer` | Escape `~` and `/` in a JSON pointer segment |
| `@scalar/json-magic/helpers/unescape-json-pointer` | Reverse of `escapeJsonPointer` |
| `@scalar/json-magic/helpers/get-segments-from-path` | Split a JSON pointer into unescaped segments |
| `@scalar/json-magic/helpers/get-value-by-path` | Read the value at a list of path segments |
| `@scalar/json-magic/helpers/set-value-at-path` | Write a value at a JSON pointer, creating missing nodes |
| `@scalar/json-magic/helpers/is-file-path` | Check whether a string looks like a file path |
| `@scalar/json-magic/helpers/is-http-url` | Check whether a string is an HTTP or HTTPS URL |
| `@scalar/json-magic/helpers/is-json-object` | Check whether a string is a JSON object |
| `@scalar/json-magic/helpers/is-yaml` | Check whether a string is valid YAML |
| `@scalar/json-magic/helpers/normalize` | Parse a JSON or YAML string into an object |

```ts
import { getValueByPath } from '@scalar/json-magic/helpers/get-value-by-path'

const { value } = getValueByPath({ components: { schemas: { User: { type: 'object' } } } }, [
  'components',
  'schemas',
  'User',
])
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
