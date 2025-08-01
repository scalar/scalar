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
