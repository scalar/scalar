# Scalar Swagger Parser

[![.github/workflows/test.yaml](https://github.com/a-numbered-company/swagger-parser/actions/workflows/test.yaml/badge.svg)](https://github.com/a-numbered-company/swagger-parser/actions/workflows/test.yaml)
[![npm](https://img.shields.io/npm/l/%40scalar%2Fswagger-parser)](https://www.npmjs.com/package/@scalar/swagger-parser)
[![npm](https://img.shields.io/npm/dt/%40scalar/%40scalar%2Fswagger-editor)](https://www.npmjs.com/package/@scalar/swagger-parser)

This package provides a WASM Swagger parser. Give it a Swagger (OpenAPI spec) JSON or YAML, receive JSON. That’s it. Based on [libopenapi](https://github.com/pb33f/libopenapi) (Go), but runs in the browser.

## Installation

```bash
npm install @scalar/swagger-parser
```

## Usage

### Await/Async

```js
import { parseSwaggerString } from '@scalar/swagger-parser'

const content = await parseSwaggerString(swaggerInput)

// { tags: [ { name: 'pets', description: '', operations: [ { path: '…
```

### Promises

```js
import { parseSwaggerString } from '@scalar/swagger-parser'

const content = parseSwaggerString(swaggerInput)
  .then((result) => {
    // { tags: [ { name: 'pets', description: '', operations: [ { path: '…
  })
  .catch((error) => {
    console.warn(error)
  })
```

### Validation

```js
import { validateSwaggerString } from '@scalar/swagger-parser'

const isValid = await validateSwaggerString(swaggerInput)

// true
```

<!-- ```js
import { parseSwaggerFile } from '@scalar/swagger-parser'

const content = await parseSwaggerFile('./swagger.yaml')
```

```js
import { parseSwaggerFile } from '@scalar/swagger-parser'

const content = parseSwaggerFile('./swagger.json', (content) => {
    console.log(content)
})
```

```js
import { parseSwaggerString } from '@scalar/swagger-parser'

const swaggerYaml = `
openapi: 3.0.3
info:
  title: Swagger Petstore - OpenAPI 3.0
`

const content = parseSwaggerString(swaggerYaml, (content) => {
    console.log(content)
})
```

```js
import { validateSwaggerFile } from '@scalar/swagger-parser'

const swaggerYaml = `
openapi: 3.0.3
info:
  title: Swagger Petstore - OpenAPI 3.0
`

const isValid = await validateSwaggerFile('swagger.yaml')
``` -->

## Development

Requirements:

- [pnpm](https://pnpm.io/installation)

```bash
pnpm install
pnpm test
```

## Contributions

Contributions are welcome.

## License

TBD
