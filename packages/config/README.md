# @scalar/config

Defining types and functions for validating Scalar configuration files, `scalar.config.json`, to be used with the Scalar app.

This package is intended to be used with the [`@scalar/cli`](../cli/README.md) using the `check` command.

## Development

We are using [Ajv](https://ajv.js.org/) for JSON schema validation.

We are using [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator) to generate the JSON schema to validate the config file against.

If there are changes to the `ScalarConfig` type, generate a new JSON file for validation with the following command

```bash
npx ts-json-schema-generator --path 'packages/config/src/scalarConfigType.ts' --type 'ScalarConfig'
```
