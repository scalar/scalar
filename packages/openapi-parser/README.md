# Scalar OpenAPI Parser

[![Version](https://img.shields.io/npm/v/%40scalar/openapi-parser)](https://www.npmjs.com/package/@scalar/openapi-parser)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/openapi-parser)](https://www.npmjs.com/package/@scalar/openapi-parser)
[![License](https://img.shields.io/npm/l/%40scalar%2Fopenapi-parser)](https://www.npmjs.com/package/@scalar/openapi-parser)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Modern OpenAPI parser written in TypeScript with support for OpenAPI 3.1, OpenAPI 3.0 and Swagger 2.0.

## Installation

```bash
npm add @scalar/openapi-parser
```

## Usage

### Validate

```ts
import { validate } from '@scalar/openapi-parser'

const file = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Hello World",
    "version": "1.0.0"
  },
  "paths": {}
}`

const { valid, errors } = await validate(file)

console.log(valid)

if (!valid) {
  console.log(errors)
}
```

### Resolve references

```ts
import { dereference } from '@scalar/openapi-parser'

const specification = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Hello World",
    "version": "1.0.0"
  },
  "paths": {}
}`

const { schema, errors } = await dereference(specification)
```

### Bundle external references

The OpenAPI specification allows to point to external files (URLs or files). But sometimes, you just want to combine all files into one.

#### Plugins

If you are on a browser environment import plugins from `@scalar/openapi-parser/plugins-browser` while if you are on a node environment you can import from `@scalar/openapi-parser/plugins`

##### fetchUrls
This plugins handles all external urls. It works for both node.js and browser environment

```ts
import { bundle } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins-browser'

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
import { bundle } from '@scalar/openapi-parser'
import { readFiles } from '@scalar/openapi-parser/plugins-browser'

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
import { bundle } from '@scalar/openapi-parser'
import { parseJson } from '@scalar/openapi-parser/plugins-browser'

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
import { bundle } from '@scalar/openapi-parser'
import { parseYaml } from '@scalar/openapi-parser/plugins-browser'

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

### Track references

The `dereference` function accepts an `onDereference` callback option that gets called whenever a reference is resolved. This can be useful for tracking which schemas are being dereferenced:

```ts
import { dereference } from '@scalar/openapi-parser'

const { schema, errors } = await dereference(specification, {
  onDereference: ({ schema, ref }) => {
    //
  },
})
```

### Modify an OpenAPI document

```ts
import { filter } from '@scalar/openapi-parser'

const specification = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Hello World",
    "version": "1.0.0"
  },
  "paths": {}
}`

const { specification } = filter(
  specification,
  (schema) => !schema?.['x-internal'],
)
```

### Upgrade your OpenAPI document

There's an `upgrade` command to upgrade all your OpenAPI documents to the latest OpenAPI version.

```ts
import { upgrade } from '@scalar/openapi-parser'

const { specification } = upgrade({
  swagger: '2.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
})

console.log(specification.openapi)
// Output: 3.1.0
```

### Sanitize your OpenAPI document

The `sanitize()` utility helps ensure your OpenAPI document is valid and complete.
It automatically adds any missing required properties like the OpenAPI version and info object, collects operation tags
and adds them to the global tags array and normalizes security scheme types.

This makes your document as OpenAPI-compliant as possible with minimal effort, handling many common specification
requirements automatically.

> ⚠️ This doesn't support Swagger 2.0 documents.

```ts
import { sanitize } from '@scalar/openapi-parser'

const result = sanitize({
  info: {
    title: 'Hello World',
  },
})

console.log(result)
```

### Then/Catch syntax

If you're more the then/catch type of guy, that's fine:

```ts
import { validate } from '@scalar/openapi-parser'

const specification = …

validate(specification, {
  throwOnError: true,
})
.then(result => {
  // Success
})
.catch(error => {
  // Failure
})
```

### TypeScript

If you just look for our types, you can install the package separately:

```bash
npm add @scalar/openapi-types
```

And use it like this:

```ts
import type { OpenAPI } from '@scalar/openapi-types'

const file: OpenAPI.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  paths: {},
}
```

### Advanced: URL and file references

You can reference other files, too. To do that, the parser needs to know what files are available.

```ts
import { dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { readFiles } from '@scalar/openapi-parser/plugins/read-files'

// Load a file and all referenced files
const { filesystem } = await load('./openapi.yaml', {
  plugins: [
    readFiles(),
    fetchUrls({
      limit: 5,
    }),
  ],
})

// Instead of just passing a single specification, pass the whole “filesystem”
const result = await dereference(filesystem)
```

As you see, `load()` supports plugins. You can write your own plugin, if you'd like to fetch API defintions from another data source, for example your database. Look at the source code of the `readFiles` to learn how this could look like.

#### Directly load URLs

Once the `fetchUrls` plugin is loaded, you can also just pass an URL:

```ts
import { dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'

// Load a file and all referenced files
const { filesystem } = await load(
  'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  {
    plugins: [fetchUrls()],
  },
)
```

#### Intercept HTTP requests

If you're using the package in a browser environment, you may run into CORS issues when fetching from URLs. You can intercept the requests, for example to use a proxy, though:

```ts
import { dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'

// Load a file and all referenced files
const { filesystem } = await load(
  'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  {
    plugins: [
      fetchUrls({
        fetch: (url) => fetch(url.replace('BANANA.net', 'jsdelivr.net')),
      }).get('https://cdn.BANANA.net/npm/@scalar/galaxy/dist/latest.yaml'),
    ],
  },
)
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## Thank you!

Thanks a ton for all the help and inspiration:

- [@philsturgeon](https://github.com/philsturgeon) to make sure we build something we won't hate.
- We took a lot of inspiration from [@seriousme](https://github.com/seriousme) and his package [openapi-schema-validator](https://github.com/seriousme/openapi-schema-validator) early-on.
- You could consider this package the modern successor of [@apidevtools/swagger-parser](https://github.com/APIDevTools/swagger-parser), we even test against it to make sure we're getting the same results (where intended).
- We stole a lot of example specification from [@mermade](https://github.com/mermade) to test against.

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
