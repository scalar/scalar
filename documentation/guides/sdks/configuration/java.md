# Java

This section details the available configuration options for the Java SDK. All configuration is managed in the `gen.yaml` file under the `java` section.

## Version and general configuration

```yml
java:
  version: 1.2.3
  projectName: "openapi"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| version | true | 0.0.1 | The current version of the SDK. |
| projectName | true | openapi | Assigns Gradle `rootProject.name`, which names the Gradle build. See [Gradle Naming](https://docs.gradle.org/current/userguide/multi_project_builds.html#naming_recommendations). |

## Publishing

```yml
java:
  groupID: "com.mycompany"
  artifactID: "my-sdk"
  githubURL: "https://github.com/mycompany/my-sdk"
  companyName: "My Company"
  companyURL: "https://www.mycompany.com"
  companyEmail: "support@mycompany.com"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| groupID | true | org.openapis | The group ID used for namespacing the package. Typically the reversed domain of an organization. |
| artifactID | true | openapi | The artifact ID used for namespacing the package, usually the name of the project. |
| githubURL | for publishing | github.com/owner/repo | The GitHub URL where the artifact is hosted. Sets metadata required by Maven. |
| companyName | for publishing | My Company | The name of your company. Sets metadata required by Maven. |
| companyURL | for publishing | www.mycompany.com | Your company's homepage URL. Sets metadata required by Maven. |
| companyEmail | for publishing | info@mycompany.com | A support email address for your company. Sets metadata required by Maven. |

## Base package name

This package will be where the primary SDK class is located
(and sub-packages will hold various types of associated generated classes):

```yaml
java:
  packageName: com.mycompany.sdk
```

## Additional Dependencies

```yml
java:
  additionalDependencies:
    - "implementation:com.fasterxml.jackson.core:jackson-databind:2.12.3"
    - "testImplementation:junit:junit:4.13.2"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| additionalDependencies | false | [] | Adds additional dependencies to include in `build.gradle`. Format: `scope:groupId:artifactId:version`. |
| additionalPlugins | false | [] | Adds additional plugins to include in `build.gradle`. Format: `id("plugin.id") version "x.x.x"`. |

## License

```yml
java:
  license:
    name: "The MIT License (MIT)"
    url: "https://mit-license.org/"
    shortName: "MIT"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| license | false | MIT License | License information. Defaults to the MIT license if not provided. |

## Method and parameter management

```yml
java:
  maxMethodParams: 4
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| maxMethodParams | false | 4 | Maximum number of parameters before an input object is created. `0` means input objects are always used. |

## Security configuration

```yml
java:
  flattenGlobalSecurity: true
```

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| flattenGlobalSecurity | Enables inline security credentials during SDK instantiation. **Recommended: `true`** | boolean | true |

## Module management

```yml
java:
  moduleFormat: "dual"
  useIndexModules: true
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| useIndexModules | false | true | Determines if index modules are generated. |
| moduleFormat | false | commonjs | Sets the module format to use when compiling the SDK (`commonjs`, `esm`, or `dual`). |

## Import management

```yml
java:
  imports:
    paths:
      callbacks: models/callbacks
      errors: models/errors
      operations: models/operations
      shared: models/components
      webhooks: models/webhooks
```

| Field | Required | Default Value | Description |
|-------|----------|---------------|-------------|
| paths | false | {} | Customizes where different parts of the SDK (e.g., callbacks, errors, and operations) will be imported from. |

### Import paths

| Component | Default Value | Description |
|-----------|---------------|-------------|
| callbacks | models/callbacks | The directory where callback models will be imported from. |
| errors | models/errors | The directory where error models will be imported from. |
| operations | models/operations | The directory where operation models (i.e., API endpoints) will be imported from. |
| shared | models/components | The directory for shared components, such as reusable schemas and data models, imported from the OpenAPI spec. |
| webhooks | models/webhooks | The directory for webhook models, if your SDK includes support for webhooks. |

## Error and response handling

```yml
java:
  clientServerStatusCodesAsErrors: false
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| clientServerStatusCodesAsErrors | false | true | Whether to treat 4xx and 5xx status codes as errors. Options: `true` or `false`. |