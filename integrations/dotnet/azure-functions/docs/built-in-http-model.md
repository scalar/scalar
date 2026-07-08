# Built-in HTTP model (`HttpRequestData`)

If your app uses the built-in Azure Functions HTTP model (rather than the ASP.NET Core integration), use the
`HttpRequestData` overload of `IScalarApiReference.HandleAsync`. It returns the `HttpResponseData` you return
from the function.

## Program.cs

```csharp
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.Azure.Functions;

var builder = FunctionsApplication.CreateBuilder(args);
builder.ConfigureFunctionsWorkerDefaults();

builder.Services.AddScalarApiReference(options =>
{
    options.Title = "My API";
});

builder.Build().Run();
```

## The function

```csharp
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Scalar.Azure.Functions;

public class ScalarFunction(IScalarApiReference scalar)
{
    [Function("ScalarApiReference")]
    public Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "scalar/{*path}")] HttpRequestData request)
        => scalar.HandleAsync(request);
}
```

As with the ASP.NET Core integration model, the catch-all route parameter must be named `path`. The handler reads
it from the function binding data to resolve static assets and the document name.

## Per-request configuration

```csharp
[Function("ScalarApiReference")]
public Task<HttpResponseData> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "scalar/{*path}")] HttpRequestData request)
    => scalar.HandleAsync(request, (options, req) =>
    {
        options.Title = "My API";
    });
```
