---
'@scalar/aws-lambda': minor
'@scalar/dotnet-shared': patch
'@scalar/azure-functions': patch
---

feat: add `Scalar.Aws.Lambda` integration to render the Scalar API reference from AWS Lambda functions fronted by Amazon API Gateway HTTP API (payload format 2.0). Supports both a zero-DI static handler factory (`ScalarApiReferenceHandler.Create`) and a DI-registered service (`AddScalarApiReference` / `IScalarApiReference`).

The hosting-agnostic request processor, render result, and static-asset table that already powered `Scalar.Azure.Functions` were moved into the shared project behind a new `SCALAR_SERVERLESS` constant so `Scalar.Aws.Lambda` can reuse them too. No public API or behavior change for `Scalar.AspNetCore`, `Scalar.Aspire`, or `Scalar.Azure.Functions`.
