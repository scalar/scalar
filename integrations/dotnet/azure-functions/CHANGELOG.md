# @scalar/azure-functions

## 0.3.0

### Bundled API Reference

- @scalar/api-reference@1.74.0

### Minor Changes

- [#10521](https://github.com/scalar/scalar/pull/10521): Add native configuration and fluent helpers for OAuth2 device authorization flows.
- [#10519](https://github.com/scalar/scalar/pull/10519): Add ShowExtensions and WithShowExtensions to display selected specification extensions from .NET integrations.
- [#10517](https://github.com/scalar/scalar/pull/10517): Add FeaturedClients and WithFeaturedClients to configure which HTTP clients appear as tabs in the Client Libraries block, in order.
- [#10520](https://github.com/scalar/scalar/pull/10520): Add native .NET localization options for locale, text direction, and nested translation overrides in the API Reference and embedded API Client.
- [#10518](https://github.com/scalar/scalar/pull/10518): Expose schema display controls in the shared .NET options: model names, visible request body properties, parameter expansion, and nested schema expansion.

## 0.2.25

### Bundled API Reference

- @scalar/api-reference@1.73.1

## 0.2.24

### Bundled API Reference

- @scalar/api-reference@1.73.0

## 0.2.23

### Bundled API Reference

- @scalar/api-reference@1.72.4

## 0.2.22

### Bundled API Reference

- @scalar/api-reference@1.72.3

## 0.2.21

### Bundled API Reference

- @scalar/api-reference@1.72.2

## 0.2.20

### Bundled API Reference

- @scalar/api-reference@1.72.1

## 0.2.19

### Bundled API Reference

- @scalar/api-reference@1.72.0

## 0.2.18

### Bundled API Reference

- @scalar/api-reference@1.71.0

## 0.2.17

### Bundled API Reference

- @scalar/api-reference@1.70.0

## 0.2.16

### Bundled API Reference

- @scalar/api-reference@1.69.2

## 0.2.15

### Bundled API Reference

- @scalar/api-reference@1.69.1

## 0.2.14

## 0.2.13

## 0.2.12

## 0.2.11

## 0.2.10

## 0.2.9

## 0.2.8

## 0.2.7

## 0.2.6

### Patch Changes

- [#9764](https://github.com/scalar/scalar/pull/9764): feat: add `Scalar.Aws.Lambda` integration to render the Scalar API reference from AWS Lambda functions fronted by Amazon API Gateway HTTP API (payload format 2.0). Supports both a zero-DI static handler factory (`ScalarApiReferenceHandler.Create`) and a DI-registered service (`AddScalarApiReference` / `IScalarApiReference`).

  The hosting-agnostic request processor, render result, and static-asset table that already powered `Scalar.Azure.Functions` were moved into the shared project behind a new `SCALAR_SERVERLESS` constant so `Scalar.Aws.Lambda` can reuse them too. No public API or behavior change for `Scalar.AspNetCore`, `Scalar.Aspire`, or `Scalar.Azure.Functions`.

## 0.2.5

## 0.2.4

## 0.2.3

## 0.2.2

## 0.2.1

## 0.2.0

### Minor Changes

- [#9620](https://github.com/scalar/scalar/pull/9620): feat: add `Scalar.Azure.Functions` integration to render the Scalar API reference from Azure Functions (isolated worker). Supports both the ASP.NET Core integration (`HttpContext`) and the built-in (`HttpRequestData`) HTTP models via `IScalarApiReference`.
