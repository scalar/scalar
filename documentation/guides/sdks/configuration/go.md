# Go

This section details the available configuration options for the Go SDK. All configuration is managed in the `gen.yaml` file under the `go` section.

## Version and general configuration

```yml
go:
  version: 1.2.3
  packageName: "custom-sdk"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| version | true | 0.0.1 | The current version of the SDK. |
| packageName | true | openapi | The Go module package name. See [Go Module Path Documentation](https://go.dev/ref/mod#module-path). |

## Additional dependencies

```yml
go:
  additionalDependencies:
    axios: "0.21.0"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| additionalDependencies | false | {} | Add additional dependencies to include in the generated `go.mod`. |

## Method and parameter management

```yml
go
  maxMethodParams: 4
  methodArguments: "require-security-and-request"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| maxMethodParams | false | 4 | The maximum number of parameters a method can have before the resulting SDK endpoint is no longer "flattened" and an input object is created. `0` will use input objects always. Must match the regex pattern `/^\\d+$/`. |
| methodArguments | false | require-security-and-request | Determines how arguments for SDK methods are generated. Options: `"infer-optional-args"` or `"require-security-and-request"`. |

## Security configuration

```yml
go
  envVarPrefix: SPEAKEASY
  flattenGlobalSecurity: true
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| clientServerStatusCodesAsErrors | false | true | Whether to treat `4xx` and `5xx` status codes as errors. |
| flattenGlobalSecurity | false | newSDK | Flatten the global security configuration if there is only a single option in the spec. |

## Import management

```yml
go
  imports:
    paths:
      callbacks: models/callbacks
      errors: models/errors
      operations: models/operations
      shared: models/components
      webhooks: models/webhooks
```

| Path | Default Value | Description |
|------|---------------|-------------|
| shared | models/components | The directory for shared components, such as reusable schemas, and data models. |
| operations | models/operations | The directory where operation models (i.e., API endpoints) will be imported from. |
| errors | models/sdkerrors | The directory where error models will be imported from. |
| callbacks | models/callbacks | The directory where callback models will be imported from. |
| webhooks | models/webhooks | The directory where webhook models will be imported from. |

## Error and response handling

```yml
go:
  responseFormat: "envelope-http"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| responseFormat | false | envelope-http | Determines the shape of the response envelope that is returned from SDK methods. Must be `envelope-http`, `envelope`, or `flat` only. |