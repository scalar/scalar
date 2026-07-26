# Limitations & roadmap

## You must provide the function

Similar to the Azure Functions integration (and unlike the ASP.NET Core integration, where
`MapScalarApiReference()` registers the endpoint for you), this package requires you to declare your own Lambda
function and forward the request to `IScalarApiReference` or the `ScalarApiReferenceHandler.Create(...)` delegate
(see [Getting Started](./getting-started.md)).

## Only API Gateway HTTP API (payload format 2.0) is supported

The following event sources are **not** supported in this first release:

- **API Gateway REST API (payload format 1.0)** — `APIGatewayProxyRequest` / `APIGatewayProxyResponse`.
- **Application Load Balancer** target groups.
- **Lambda Function URLs**.

These event shapes differ enough (route/path parameter resolution, header shape, stage handling) that supporting
them well deserves dedicated adapters rather than a best-effort shim. This is a roadmap item — if you need one of
these today, you can call `ScalarRequestProcessor`-equivalent logic yourself via the lower-level building blocks in
`Scalar.Shared`, or use the `Scalar.AspNetCore` package if you're hosting a full ASP.NET Core app in Lambda via
`Amazon.Lambda.AspNetCoreServer`.

## Route parameter name

The catch-all route parameter must be named `proxy` (e.g. `Path: /scalar/{proxy+}`). The adapter reads this value
from `request.PathParameters["proxy"]` to distinguish a static asset request from the reference page and to
resolve the document name.

## Custom domain base path mappings

Stage auto-detection reads `request.RequestContext.Stage`, which does not reflect a custom domain name's base path
mapping. If you use one, set `ScalarOptions.RoutePrefix` explicitly to the base path.

## Hosting a full ASP.NET Core app

If you host a complete ASP.NET Core application in Lambda (via `Amazon.Lambda.AspNetCoreServer` /
`Amazon.Lambda.AspNetCoreServer.Hosting`), use the existing `Scalar.AspNetCore` package's
`MapScalarApiReference()` directly instead of `Scalar.Aws.Lambda`.
