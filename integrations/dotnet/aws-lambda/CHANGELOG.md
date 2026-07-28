# @scalar/aws-lambda

## 0.1.0

### Minor Changes

- feat: add `Scalar.Aws.Lambda` integration to render the Scalar API reference from AWS Lambda functions fronted by Amazon API Gateway HTTP API (payload format 2.0). Supports both a zero-DI static handler factory (`ScalarApiReferenceHandler.Create`) and a DI-registered service (`AddScalarApiReference` / `IScalarApiReference`).
