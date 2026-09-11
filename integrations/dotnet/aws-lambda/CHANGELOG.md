# @scalar/aws-lambda

## 0.2.7

## 0.2.6

## 0.2.5

## 0.2.4

## 0.2.3

## 0.2.2

## 0.2.1

## 0.2.0

### Minor Changes

- [#9764](https://github.com/scalar/scalar/pull/9764): feat: add `Scalar.Aws.Lambda` integration to render the Scalar API reference from AWS Lambda functions fronted by Amazon API Gateway HTTP API (payload format 2.0). Supports both a zero-DI static handler factory (`ScalarApiReferenceHandler.Create`) and a DI-registered service (`AddScalarApiReference` / `IScalarApiReference`).

  The hosting-agnostic request processor, render result, and static-asset table that already powered `Scalar.Azure.Functions` were moved into the shared project behind a new `SCALAR_SERVERLESS` constant so `Scalar.Aws.Lambda` can reuse them too. No public API or behavior change for `Scalar.AspNetCore`, `Scalar.Aspire`, or `Scalar.Azure.Functions`.

## 0.1.0

### Minor Changes

- feat: add `Scalar.Aws.Lambda` integration to render the Scalar API reference from AWS Lambda functions fronted by Amazon API Gateway HTTP API (payload format 2.0). Supports both a zero-DI static handler factory (`ScalarApiReferenceHandler.Create`) and a DI-registered service (`AddScalarApiReference` / `IScalarApiReference`).
