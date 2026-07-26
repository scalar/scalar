# Getting Started

`Scalar.Aws.Lambda` renders the Scalar API reference from an AWS Lambda function fronted by an **Amazon API
Gateway HTTP API** using **payload format 2.0** (`APIGatewayHttpApiV2ProxyRequest` / `APIGatewayHttpApiV2ProxyResponse`).

> [!NOTE]
> Only API Gateway HTTP APIs are supported. See [Limitations & roadmap](./limitations.md) for REST APIs (payload
> format 1.0), Application Load Balancer and Lambda Function URLs.

## 1. Install the package

```shell
dotnet add package Scalar.Aws.Lambda
```

## 2. Choose an entry point

`Scalar.Aws.Lambda` ships two entry points that share the same implementation, so pick whichever matches how your
function is hosted.

### Option A — Zero-DI static factory

For a plain Lambda function with no dependency injection container, `ScalarApiReferenceHandler.Create(...)` returns
a ready-to-use request/response delegate:

```csharp
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.SystemTextJson;
using Scalar.Aws.Lambda;

var handler = ScalarApiReferenceHandler.Create(options =>
{
    options.Title = "My API";
});

await LambdaBootstrapBuilder.Create<APIGatewayHttpApiV2ProxyRequest, APIGatewayHttpApiV2ProxyResponse>(handler, new DefaultLambdaJsonSerializer())
    .Build()
    .RunAsync();
```

### Option B — Dependency injection

For a hosted Lambda function using `Amazon.Lambda.RuntimeSupport`'s generic host, register Scalar as a service and
resolve `IScalarApiReference`:

```csharp
using Microsoft.Extensions.DependencyInjection;
using Scalar.Aws.Lambda;

var services = new ServiceCollection();
services.AddScalarApiReference(options =>
{
    options.Title = "My API";
});

await using var provider = services.BuildServiceProvider();

// Resolve IScalarApiReference from a scope per invocation, since it is registered scoped.
using var scope = provider.CreateScope();
var scalar = scope.ServiceProvider.GetRequiredService<IScalarApiReference>();

var response = await scalar.HandleAsync(request, context);
```

> [!IMPORTANT]
> `IScalarApiReference` is registered `Scoped`. Create a new DI scope per invocation (standard Lambda + DI
> guidance) rather than resolving it from the root provider.

## 3. Declare the API Gateway route

The route must use the `{proxy+}` greedy path parameter (plus a plain route for the bare index), for example in a
SAM template:

```yaml
Events:
  ScalarIndex:
    Type: HttpApi
    Properties:
      Path: /scalar
      Method: GET
  ScalarProxy:
    Type: HttpApi
    Properties:
      Path: /scalar/{proxy+}
      Method: ANY
```

See [HTTP API event model](./http-api-model.md) for details on how the `{proxy+}` value and the API Gateway stage
are used to resolve static assets, document names and relative URLs.

## 4. Point Scalar at your OpenAPI document

By default Scalar looks for the OpenAPI document at `openapi/{documentName}.json` (relative to the reference).
Expose your document at that route, or change the pattern:

```csharp
options.AddDocument("v1", routePattern: "openapi/v1.json");
```

## 5. Stages and route prefixes

When your API Gateway stage is *not* `$default` (e.g. `prod`), `Scalar.Aws.Lambda` auto-detects the stage name and
strips it from the relative URLs it renders, so you don't need to configure anything. If you use a custom domain
base path mapping (which is invisible to the stage name), set `ScalarOptions.RoutePrefix` explicitly:

```csharp
options.RoutePrefix = "my-base-path";
```

## Per-request configuration

Both entry points accept an optional callback to customize options per request:

```csharp
// Static factory
var handler = ScalarApiReferenceHandler.Create(options => options.Title = "My API");

// DI
var response = await scalar.HandleAsync(request, context, (options, req) =>
{
    options.Title = $"My API ({req.RequestContext.DomainName})";
});
```
