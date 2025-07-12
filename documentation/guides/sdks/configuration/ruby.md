# Ruby

 This section details the available configuration options for the Ruby SDK. All configuration is managed in the `gen.yaml` file under the `ruby` section.

## Version and general configuration

```yml
ruby:
  version: 1.2.3
  author: "Author Name"
  packageName: "custom-sdk"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| version | true | 0.0.1 | The current version of the SDK. |
| packageName | true | openapi | The name of the package. |
| author | true | Speakeasy | The name of the author of the published package. |

## Method and parameter management
```yml
ruby:
  maxMethodParams: 4
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| maxMethodParams | false | 4 | Sets the maximum number of parameters before an input object is created. `0` means input objects are always used. |

## Module management

```yml
ruby:
  module: "OpenApiSdk"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| module | true | OpenAPISdk | [See Docs](https://ruby-doc.org/core-2.5.3/Module.html). |

## Import management

```yml
ruby:
  imports:
    option: "openapi"
    paths:
      callbacks: models/callbacks
      errors: models/errors
      operations: models/operations
      shared: models/components
      webhooks: models/webhooks
```

| Field | Required | Default Value | Description |
|-------|----------|---------------|-------------|
| option | false | "openapi" | Defines the type of import strategy. Typically set to `"openapi"`, indicating that the structure is based on the OpenAPI document. |
| paths | false | {} | Customizes where different parts of the SDK (e.g., callbacks, errors, and operations) will be imported from. |

### Import paths

| Component | Default Value | Description |
|-----------|---------------|-------------|
| callbacks | models/callbacks | The directory where callback models will be imported from. |
| errors | models/errors | The directory where error models will be imported from. |
| operations | models/operations | The directory where operation models (i.e., API endpoints) will be imported from. |
| shared | models/components | The directory for shared components, such as reusable schemas, and data models imported from the OpenAPI spec. |
| webhooks | models/webhooks | The directory for webhook models, if the SDK includes support for webhooks. |