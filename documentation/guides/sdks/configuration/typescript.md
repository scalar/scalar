# Typescript

This section details the available configuration options for the TypeScript SDK. All configuration is managed in the `gen.yaml` file under the `typescript` section.

## Version and general configuration

```yml
typescript:
  version: 1.2.3
  author: "Author Name"
  packageName: "custom-sdk"
```

| Name        | Required | Default Value | Description                                                                                                                                                            |
| ----------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| version     | true     | 0.0.1         | The current version of the SDK.                                                                                                                                        |
| packageName | true     | openapi       | The name of the npm package. See [npm package guidelines](https://docs.npmjs.com/package-name-guidelines).                                                             |
| author      | true     | Speakeasy     | The name of the author of the published package. See [npm author field](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#people-fields-author-contributors). |

## Additional JSON package

```yml
typescript:
  additionalPackageJSON:
    license: "MIT"
```

| Name                  | Required | Default Value | Description                                                                              |
| --------------------- | -------- | ------------- | ---------------------------------------------------------------------------------------- |
| additionalPackageJSON | false    | {}            | Additional key/value pairs for the `package.json` file. Example: license, keywords, etc. |

## Additional dependencies

```yml
typescript:
  additionalDependencies:
    dependencies:
      axios: "^0.21.0"
    devDependencies:
      typescript: "^4.0.0"
    peerDependencies:
      react: "^16.0.0"
```

| Name             | Required | Default Value | Description                                                           |
| ---------------- | -------- | ------------- | --------------------------------------------------------------------- |
| dependencies     | false    | {}            | Additional production dependencies to include in the `package.json`.  |
| devDependencies  | false    | {}            | Additional development dependencies to include in the `package.json`. |
| peerDependencies | false    | {}            | Peer dependencies for compatibility.                                  |

## Method and parameter management

```yml
typescript:
  maxMethodParams: 3
  methodArguments: "require-security-and-request"
```

| Name            | Required | Default Value                  | Description                                                                                              |
| --------------- | -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| maxMethodParams | false    | 0                              | Maximum number of parameters before an input object is created. `0` means input objects are always used. |
| flatteningOrder | false    | parameters-first or body-first | Determines the ordering of method arguments when flattening parameters and body fields.                  |
| methodArguments | false    | require-security-and-request   | Determines how arguments for SDK methods are generated.                                                  |

## Security configuration

```yml
typescript:
  envVarPrefix: SPEAKEASY
  flattenGlobalSecurity: true
```

| Property              | Description                                                                                            | Type    | Default |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------- | ------- |
| flattenGlobalSecurity | Enables inline security credentials during SDK instantiation. **Recommended: `true`**                  | boolean | true    |
| envVarPrefix          | Sets a prefix for environment variables that allows users to configure global parameters and security. | string  | N/A     |

## Module management

```yml
typescript:
  moduleFormat: "dual"
  useIndexModules: true
```

| Name            | Required | Default Value | Description                                                                                                                                                                   |
| --------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| useIndexModules | false    | true          | Controls generation of index modules (`index.ts`). Setting to `false` improves tree-shaking and build performance by avoiding barrel files.                                   |
| moduleFormat    | false    | commonjs      | Sets the module format to use when compiling the SDK (`commonjs`, `esm`, or `dual`). Using `dual` provides optimal compatibility while enabling modern bundler optimizations. |

> **Performance optimization**
> 
> For optimal bundle size and tree-shaking performance in modern applications, we recommend using `moduleFormat: "dual"` together with `useIndexModules: false`. This combination ensures maximum compatibility while enabling the best possible bundler optimizations.
> 
> See the [module format configuration guide](https://guides.scalar.com/docs/customize/typescript/configuring-module-format) and [barrel files documentation](https://guides.scalar.com/docs/customize/typescript/disabling-barrel-files) for detailed information about these optimizations.

## Import management

```yml
typescript:
  imports:
    option: "openapi"
    paths:
      callbacks: models/callbacks
      errors: models/errors
      operations: models/operations
      shared: models/components
      webhooks: models/webhooks
```

| Field  | Required | Default Value | Description                                                                                                                        |
| ------ | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| option | false    | "openapi"     | Defines the type of import strategy. Typically set to `"openapi"`, indicating that the structure is based on the OpenAPI document. |
| paths  | false    | {}            | Customizes where different parts of the SDK (e.g., callbacks, errors, and operations) will be imported from.                       |

### Import paths

| Component  | Default Value     | Description                                                                                                    |
| ---------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| callbacks  | models/callbacks  | The directory where callback models will be imported from.                                                     |
| errors     | models/errors     | The directory where error models will be imported from.                                                        |
| operations | models/operations | The directory where operation models (i.e., API endpoints) will be imported from.                              |
| shared     | models/components | The directory for shared components, such as reusable schemas, and data models imported from the OpenAPI spec. |
| webhooks   | models/webhooks   | The directory for webhook models, if the SDK includes support for webhooks.                                    |

## Error and response handling

```yml
typescript:
  clientServerStatusCodesAsErrors: false
  responseFormat: "envelope-http"
  enumFormat: "union"
```

| Property                        | Description                                                                                      | Type    | Default       |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------- | ------------- |
| responseFormat                  | Defines how responses are structured. Options: `envelope`, `envelope-http`, or `flat`.           | string  | envelope-http |
| enumFormat                      | Determines how enums are generated. Options: `enum` (TypeScript enums) or `union` (union types). | string  | union         |
| clientServerStatusCodesAsErrors | Treats `4XX` and `5XX` status codes as errors. Set to `false` to treat them as normal responses. | boolean | true          |
