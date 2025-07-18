# PHP

 This section details the available configuration options for the PHP SDK. All configuration is managed in the `gen.yaml` file under the `php` section.

## Version and general configuration

```yml
php:
  version: 1.2.3
  packageName: "openapi/openapi"
  namespace: "OpenAPI\\OpenAPI"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| version | true | 0.0.1 | The current version of the SDK. |
| packageName | true | openapi/openapi | The name of the composer package. See [Composer Package Naming](https://getcomposer.org/doc/04-schema.md#name). |
| namespace | true | OpenAPI\\OpenAPI | The namespace for the package. See [PHP Namespace Documentation](https://www.php.net/manual/en/language.namespaces.rationale.php). |

## Method and parameter management
```yml
php:
  maxMethodParams: 4
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| maxMethodParams | false | 4 | Sets the maximum number of parameters before an input object is created. `0` means input objects are always used. |

## Security configuration

```yml
php:
  flattenGlobalSecurity: true
```

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| flattenGlobalSecurity | Enables inline security credentials during SDK instantiation. **Recommended: `true`** | boolean | true |

## Import management

```yml
php:
  imports:
    option: "openapi"
    paths:
      callbacks: models/Callbacks
      errors: models/Errors
      operations: models/Operations
      shared: models/Components
      webhooks: models/Webhooks
```

| Field | Required | Default Value | Description |
|-------|----------|---------------|-------------|
| option | false | "openapi" | Defines the type of import strategy. Typically set to `"openapi"`, indicating that the structure is based on the OpenAPI document. |
| paths | false | {} | Customizes where different parts of the SDK (e.g., callbacks, errors, operations) will be imported from. |

### Import paths

| Component | Default Value | Description |
|-----------|---------------|-------------|
| callbacks | models/callbacks | The directory where callback models will be imported from. |
| errors | models/errors | The directory where error models will be imported from. |
| operations | models/operations | The directory where operation models (i.e., API endpoints) will be imported from. |
| shared | models/components | The directory for shared components, such as reusable schemas, and data models imported from the OpenAPI spec. |
| webhooks | models/webhooks | The directory for webhook models, if the SDK includes support for webhooks. |

## Error and Response Handling

```yml
php:
  clientServerStatusCodesAsErrors: true
  responseFormat: "flat"
  enumFormat: "enum"
```

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| clientServerStatusCodesAsErrors | false | true | Whether to treat 4XX and 5XX status codes as errors. |
| responseFormat | false | flat | Defines how responses are structured. Options: `envelope`, `envelope-http`, or `flat`. |

## Laravel service provider

When a PHP SDK is used within a Laravel application, Speakeasy is able to generate the needed [Service Provider](https://laravel.com/docs/master/providers)
code to support seamless integration.

> ...all of Laravel's core services, are bootstrapped via service providers.
>
> But, what do we mean by "bootstrapped"? In general, we mean registering things, including registering service container bindings, event listeners, middleware, and even routes. Service providers are the central place to configure the application.

To enable the Laravel Service Provider generation, update the `gen.yaml` configuration setting `enabled` to `true`, and set `svcName` appropriately.

```yml
php:
  laravelServiceProvider:
    enabled: true
    svcName: "openapi"
```

| Field | Required | Default Value | Description |
|-------|----------|---------------|-------------|
| laravelServiceProvider | false | {} | Configure the generation of the Service Provider. |

### Laravel service provider configuration

| Field | Required | Default Value | Description |
|-------|----------|---------------|-------------|
| enabled | false | false | Set to true to enable Service Provider generation. |
| svcName | false | "openapi" | The name to be used for the service provider. |

## Additional dependencies

```yml
php:
 additionalDependencies: {
    "autoload": {
      "OpenAPI\\OpenAPI\\Lib\\": "lib/"
    },
    "autoload-dev": {
      "OpenAPI\\OpenAPI\\Test\\": "Tests/"
      },
    "require": {
      "firebase/php-jwt": "^6.10",
      "phpseclib/phpseclib": "^3.0"
    },
    "require-dev": {
      "monolog/monolog": "^3.0"
    }
  }
```

| Field | Required | Default Value | Description |
|-------|----------|---------------|-------------|
| additionalDependencies | false | {} | Adds additional dependencies and autoload mappings to the generated `composer.json` file. |

### Additional dependencies configuration

| Name | Required | Default Value | Description |
|------|----------|---------------|-------------|
| autoload | false | {} | Defines autoload mappings for the `autoload.psr4` section. |
| autoload-dev | false | {} | Defines autoload mappings for the `autoload-dev.psr4` section (for development and testing). |
| require | false | {} | Adds additional dependencies to the `require` section. |
| require-dev | false | {} | Adds additional dependencies to the `require-dev` section (for development and testing). |