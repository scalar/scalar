# Scalar Galaxy OpenAPI Example

[![Version](https://img.shields.io/npm/v/%40scalar/galaxy)](https://www.npmjs.com/package/@scalar/galaxy)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/galaxy)](https://www.npmjs.com/package/@scalar/galaxy)
[![License](https://img.shields.io/npm/l/%40scalar%2Fgalaxy)](https://www.npmjs.com/package/@scalar/galaxy)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

An OpenAPI example specification in YAML and JSON to test OpenAPI tooling, run test suites or learn about OpenAPI.

## Installation

```bash
npm install @scalar/galaxy
```

## Usage

### Scalar Registry

| Version | Format  | URL                                                                |
| ------- | ------- | ------------------------------------------------------------------ |
| Latest  | Preview | https://registry.scalar.com/@scalar/apis/galaxy                    |
| Latest  | JSON    | https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json |
| Latest  | YAML    | https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml |

### CDN

| Version     | Format | URL                                                          |
| ----------- | ------ | ------------------------------------------------------------ |
| Latest      | JSON   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json |
| Latest      | YAML   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml |
| OpenAPI 3.1 | JSON   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/3.1.json    |
| OpenAPI 3.1 | YAML   | https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/3.1.yaml    |

### Import as object

```ts
import ScalarGalaxy from '@scalar/galaxy/latest.json'
```

### Import as JSON string

```ts
import ScalarGalaxy from '@scalar/galaxy/latest.json?raw'
```

### Import as YAML string

```ts
import ScalarGalaxy from '@scalar/galaxy/latest.yaml?raw'
```

### Import specific OpenAPI version

```ts
import ScalarGalaxy from '@scalar/galaxy/3.1.json'
```

## Development

Use the `@scalar/mock-server` to serve an OpenAPI document:

```bash
npm run dev
```

Explore the API by making requests to it using your favourite API exploration tools:

```bash
curl http://localhost:5052/planets
```

Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Mars",
      "description": "The red planet",
      "image": "https://cdn.scalar.com/photos/mars.jpg",
      "creator": {
        "id": 1,
        "name": "Marc",
        "email": "marc@scalar.com"
      }
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 100,
    "next": "/planets?limit=10&offset=10"
  }
}
```

### Serve an OpenAPI document using the CLI

```bash
npx @scalar/cli document serve ./src/documents/3.1.yaml --watch
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
