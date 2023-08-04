# Scalar CLI (Draft)

Generate, share and publish beautiful API documentations from the command line.

## Usage

You’ll need a Open API (ex Swagger) file. If you just want to play around, [download our example file](#).

### Open our Swagger editor (with live preview)

`npx @scalarorg/cli edit swagger.json`

### Generate a beautiful API documentation from a Open API file (ex Swagger).

`npx @scalarorg/cli build swagger.json`

### Publish your API documentation for free.

`npx @scalarorg/cli publish swagger.json`

### Lint an Open API file

`npx @scalarorg/cli lint swagger.json`

## Installation

If you’d like to have your commands shorter, you can install our CLI with `npm install -g @scalar/cli`. And then use it like this:

```bash
scalar edit swagger.json
scalar build swagger.json
scalar publish swagger.json
scalar lint swagger.json
```
