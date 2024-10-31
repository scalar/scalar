# Scalar OpenAPI Parser

[![Version](https://img.shields.io/npm/v/%40scalar/openapi-parser)](https://www.npmjs.com/package/@mintlify/openapi-parser)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/openapi-parser)](https://www.npmjs.com/package/@mintlify/openapi-parser)
[![License](https://img.shields.io/npm/l/%40scalar%2Fopenapi-parser)](https://www.npmjs.com/package/@mintlify/openapi-parser)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Modern OpenAPI parser written in TypeScript with support for OpenAPI 3.1, OpenAPI 3.0 and Swagger 2.0.

## Goals

- [x] Written in TypeScript
- [x] Runs in Node.js and in the browser (without any polyfills or configuration)
- [x] Tested with hundreds of real world examples
- [ ] Amazing error output
- [ ] Support for OpenAPI 4.0 👀

## Installation

```bash
npm add @mintlify/openapi-parser
```

## Usage

### Validate

```ts
import { validate } from '@mintlify/openapi-parser'

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
import { dereference } from '@mintlify/openapi-parser'

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

### Modify an OpenAPI specification

```ts
import { filter } from '@mintlify/openapi-parser'

const specification = `{
  "openapi": "3.1.0",
  "info": {
    "title": "Hello World",
    "version": "1.0.0"
  },
  "paths": {}
}`

const { specification } = filter(specification, (schema) => !schema?.['x-internal'])
```

### Upgrade your OpenAPI specification

There’s an `upgrade` command to upgrade all your OpenAPI specifications to the latest OpenAPI version.

> ⚠️ The upgrade from Swagger 2.0 is still experimental and probably lacks features.

```ts
import { upgrade } from '@mintlify/openapi-parser'

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

### Pipeline syntax

```ts
import { openapi } from '@mintlify/openapi-parser'

const specification = …

// New pipeline …
const result = openapi()
  // loads the specification …
  .load(specification)
  // upgrades to OpenAPI 3.1 …
  .upgrade()
  // removes all internal operations …
  .filter((schema) => !schema?.['x-internal'])
  // done!
  .get()
```

### Then/Catch syntax

If you’re more the then/catch type of guy, that’s fine:

```ts
import { validate } from '@mintlify/openapi-parser'

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
npm add @mintlify/openapi-types
```

And use it like this:

```ts
import type { OpenAPI } from '@mintlify/openapi-types'

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
import { dereference, load } from '@mintlify/openapi-parser'
import { fetchUrls } from '@mintlify/openapi-parser/plugins/fetch-urls'
import { readFiles } from '@mintlify/openapi-parser/plugins/read-files'

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

As you see, `load()` supports plugins. You can write your own plugin, if you’d like to fetch API defintions from another data source, for example your database. Look at the source code of the `readFiles` to learn how this could look like.

#### Directly load URLs

Once the `fetchUrls` plugin is loaded, you can also just pass an URL:

```ts
import { dereference, load } from '@mintlify/openapi-parser'
import { fetchUrls } from '@mintlify/openapi-parser/plugins/fetch-urls'

// Load a file and all referenced files
const { filesystem } = await load(
  'https://cdn.jsdelivr.net/npm/@mintlify/galaxy/dist/latest.yaml',
  {
    plugins: [fetchUrls()],
  },
)
```

#### Intercept HTTP requests

If you’re using the package in a browser environment, you may run into CORS issues when fetching from URLs. You can intercept the requests, for example to use a proxy, though:

```ts
import { dereference, load } from '@mintlify/openapi-parser'
import { fetchUrls } from '@mintlify/openapi-parser/plugins/fetch-urls'

// Load a file and all referenced files
const { filesystem } = await load(
  'https://cdn.jsdelivr.net/npm/@mintlify/galaxy/dist/latest.yaml',
  {
    plugins: [
      fetchUrls({
        fetch: (url) => fetch(url.replace('BANANA.net', 'jsdelivr.net')),
      }).get('https://cdn.BANANA.net/npm/@mintlify/galaxy/dist/latest.yaml'),
    ],
  },
)
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## Thank you!

Thanks a ton for all the help and inspiration:

- [@philsturgeon](https://github.com/philsturgeon) to make sure we build something we won’t hate.
- We took a lot of inspiration from [@seriousme](https://github.com/seriousme) and his package [openapi-schema-validator](https://github.com/seriousme/openapi-schema-validator) early-on.
- You could consider this package the modern successor of [@apidevtools/swagger-parser](https://github.com/APIDevTools/swagger-parser), we even test against it to make sure we’re getting the same results (where intended).
- We stole a lot of example specification from [@mermade](https://github.com/mermade) to test against.

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
