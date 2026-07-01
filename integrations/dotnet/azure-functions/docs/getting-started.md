# Getting Started

`Scalar.Azure.Functions` targets the **isolated worker** model and supports both Azure Functions HTTP models:

- The **ASP.NET Core integration** model (`HttpContext`) — recommended.
- The **built-in** model (`HttpRequestData` / `HttpResponseData`) — see [built-in HTTP model](./built-in-http-model.md).

> [!NOTE]
> The in-process model is not supported (it reaches end of support in November 2026).

## 1. Install the package

```shell
dotnet add package Scalar.Azure.Functions
```

You also need the Azure Functions HTTP extension for the model you use. For the ASP.NET Core integration model:

```shell
dotnet add package Microsoft.Azure.Functions.Worker.Extensions.Http.AspNetCore
```

## 2. Register the services

In `Program.cs`, enable the ASP.NET Core integration and register Scalar:

```csharp
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.Azure.Functions;

var builder = FunctionsApplication.CreateBuilder(args);
builder.ConfigureFunctionsWebApplication();

builder.Services.AddScalarApiReference(options =>
{
    options.Title = "My API";
});

builder.Build().Run();
```

## 3. Add the function

Inject `IScalarApiReference` and route a catch-all HTTP trigger to it.

> [!IMPORTANT]
> The catch-all route parameter **must** be named `path` (e.g. `Route = "scalar/{*path}"`). The reference uses it
> to resolve static assets and the document name.

```csharp
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Scalar.Azure.Functions;

public class ScalarFunction(IScalarApiReference scalar)
{
    [Function("ScalarApiReference")]
    public Task Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "scalar/{*path}")] HttpRequest request)
        => scalar.HandleAsync(request.HttpContext);
}
```

With the default Azure Functions route prefix (`api`), the reference is now served at `/api/scalar/`.

## 4. Point Scalar at your OpenAPI document

By default Scalar looks for the OpenAPI document at `openapi/{documentName}.json` (relative to the reference).
Expose your document at that route, or change the pattern:

```csharp
builder.Services.AddScalarApiReference(options =>
{
    options.AddDocument("v1", routePattern: "openapi/v1.json");
});
```

The relative document URL is resolved in the browser against the reference's base path, so it works regardless of
the host's route prefix or a sub-path deployment.

Scalar assumes Azure Functions' default HTTP route prefix is `api`. If you change the prefix in `host.json`, mirror
that value in Scalar:

```csharp
builder.Services.AddScalarApiReference(options =>
{
    options.RoutePrefix = "functions";
});
```

If you disable the Azure Functions route prefix, set `options.RoutePrefix = null`.

## Per-request configuration

`HandleAsync` accepts an optional callback to customize options per request (for example, to vary options by
`HttpContext`):

```csharp
[Function("ScalarApiReference")]
public Task Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "scalar/{*path}")] HttpRequest request)
    => scalar.HandleAsync(request.HttpContext, (options, context) =>
    {
        options.Title = $"My API ({context.Request.Host})";
    });
```
