# C#

 This section details the available configuration options for the C# SDK. All configuration is managed in the `gen.yaml` file under the `csharp` section.

## Version and general configuration

```yml
csharp:
  version: 1.2.3
  author: "Author Name"
  packageName: "custom-sdk"
  dotnetVersion: "net8.0"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| version | true | 0.0.1 | The current version of the SDK. |
| packageName | true | openapi | The [NuGet package ID](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/names-of-namespaces), also used as the root namespace |
| author | true | Speakeasy | The name of the [author](https://learn.microsoft.com/en-us/nuget/create-packages/package-authoring-best-practices#authors) of the published package. |
| dotnetVersion | false | dotnetVersion | The [version](https://learn.microsoft.com/en-us/dotnet/standard/frameworks) of .NET to target. net8.0 (default), net6.0 and net5.0 supported. |

## Publishing configuration
```yml
csharp:
  packageTags: "openapi sdk rest"
  includeDebugSymbols: true
  enableSourceLink: true
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| packageTags | false | "" | Space-delimited list of tags and keywords used when searching for packages on NuGet. |
| includeDebugSymbols | false | false | Whether to generate `.pdb` files and publish a `.snupkg` symbol package to NuGet. |
| enableSourceLink | false | false | Whether to produce and publish the package with Source Link. See [Source Link](https://github.com/dotnet/sourcelink). |

## Additional dependencies

```yml
csharp:
  additionalDependencies:
    - package: Newtonsoft.Json
      version: 13.0.3
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| additionalDependencies | false | [] | Add additional dependencies to include in the generated `.csproj` file. Dependencies must be specified as objects with package and version properties. |

## Method and parameter management
```yml
csharp:
  maxMethodParams: 4
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| maxMethodParams | false | 4 | Maximum number of parameters before an input object is created. `0` means input objects are always used. |

## Security configuration

```yml
csharp:
  flattenGlobalSecurity: true
```

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| flattenGlobalSecurity | Enables inline security credentials during SDK instantiation. **Recommended: `true`** | boolean | true |

## Module management

```yml
csharp:
  sourceDirectory: "src"
  disableNamespacePascalCasingApr2024: false
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| sourceDirectory | false | src | The name of the source directory. |
| disableNamespacePascalCasingApr2024 | false | false | Whether to disable Pascal Casing sanitization on the `packageName` when setting the root namespace and NuGet package ID. |

## Import management

```yml
csharp:
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
| shared | models/components | The directory for shared components, such as reusable schemas, and data models, imported from the OpenAPI spec. |
| webhooks | models/webhooks | The directory for webhook models, if the SDK includes support for webhooks. |

## Error and response handling
```yml
csharp:
  clientServerStatusCodesAsErrors: true
  responseFormat: "envelope-http"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| responseFormat | false | envelope-http | Defines how responses are structured. Options: `envelope`, `envelope-http`, or `flat`. |
| clientServerStatusCodesAsErrors | false | true | Treats `4XX` and `5XX` status codes as errors. Set to `false` to treat them as normal responses.