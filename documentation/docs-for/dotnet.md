# .NET API documentation

Turn the OpenAPI document your ASP.NET Core app already generates into interactive API documentation with one NuGet package and one line in `Program.cs`.

Since .NET 9, the ASP.NET Core Web API template no longer includes Swashbuckle. Microsoft [announced the change](https://github.com/dotnet/aspnetcore/issues/54599) and moved OpenAPI generation into the built-in `Microsoft.AspNetCore.OpenApi` package. That package produces the document, but it does not ship a UI to read it. Microsoft Learn documents Scalar as one way to fill that gap, in the section [Use Scalar for interactive API documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents#use-scalar-for-interactive-api-documentation). This page shows the same setup, what you get beyond a reference, and how to move over from Swagger UI.

## Set up Scalar in ASP.NET Core

<scalar-steps>
  <scalar-step id="install" title="Install Scalar.AspNetCore">

Add the package to your API project:

```shell
dotnet add package Scalar.AspNetCore
```

  </scalar-step>

  <scalar-step id="configure" title="Map the OpenAPI document and the reference">

In `Program.cs`, register the built-in OpenAPI generator and map Scalar next to it. This is the same shape as the snippet on Microsoft Learn:

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapGet("/", () => "Hello world!");

app.Run();
```

`MapOpenApi()` serves the document at `/openapi/v1.json`, and `MapScalarApiReference()` reads it from there by default.

  </scalar-step>

  <scalar-step id="open" title="Run the app and open /scalar">

Start the app with `dotnet run` and open `https://localhost:<port>/scalar`. To have Visual Studio or `dotnet run` open it for you, set `"launchUrl": "scalar"` in the `https` profile of `Properties/launchSettings.json`.

  </scalar-step>
</scalar-steps>

Microsoft [recommends](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents) enabling OpenAPI UIs (it names Swagger UI, ReDoc and Scalar) only in development, which is why the snippet sits behind `IsDevelopment()`. If you do want public docs, see the hosting options further down.

## Try a live reference

This is the Scalar Galaxy example API rendered by the same API reference component that `Scalar.AspNetCore` serves. Click any operation and send a request from the built-in client.

<iframe src="https://galaxy.scalar.com" title="Scalar Galaxy example API reference" loading="lazy" width="100%" height="600"></iframe>

[Open the live demo in a new tab](https://galaxy.scalar.com)

## Customize it

`MapScalarApiReference` takes a fluent options builder, so configuration stays in C#:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithTitle("E-Commerce API")
           .WithClassicLayout()
           .ForceDarkMode()
           .ExpandAllTags()
           .SortTagsAlphabetically()
           .AddServer("https://api.company.com", "Production")
           .AddServer("https://staging-api.company.com", "Staging");
});
```

You can also change the route (`app.MapScalarApiReference("/docs")`), pre-fill authentication for API key, bearer, basic and OAuth 2.0 schemes during development, and render several OpenAPI documents in one reference. The [ASP.NET Core integration guide](/products/api-references/integrations/aspnetcore/integration) lists every option. If you run .NET Aspire, there is a dedicated [Aspire integration](/products/api-references/integrations/aspire) that puts one reference in front of all your services.

## What you get

The NuGet package is the start. The OpenAPI document it reads is the same input for everything else Scalar builds.

- **An interactive [API reference](/products/api-references).** Every endpoint, schema and example from your controllers or minimal APIs, with search, dark mode, and request code samples for popular languages and HTTP clients. MIT licensed.
- **A built-in [API client](/products/api-client).** The "Test Request" button opens a full client with environments, authentication and request history. It also runs as a desktop and web app.
- **[SDKs](/products/sdk-generator)** generated from the same document. TypeScript, Python, Go and CLI are generally available. C#, Java, Kotlin, Ruby, PHP, Rust, Swift, Dart and C++ are experimental.
- **A [hosted MCP server](/products/agent/mcp)** so AI agents can call the endpoints you choose, with OAuth. Scalar hosts it; there is nothing extra to deploy.

To use the last two, publish the document to the [Scalar Registry](/products/registry). Generate it at build time (see [build-time generation](/products/api-references/integrations/aspnetcore/build-time-generation)) and push it from CI:

```shell
npx @scalar/cli registry publish \
  --namespace your-namespace \
  --slug your-api \
  ./openapi.json
```

Free hosted docs cover up to 3 APIs and one SDK for APIs up to 25 endpoints. Pro is $150 per month. See [pricing](/pricing) for the full breakdown.

## Migrating from Swashbuckle and Swagger UI

You do not need to rewrite anything to switch. Scalar only needs a URL that returns an OpenAPI document, and every popular .NET generator can provide one.

**Keeping Swashbuckle's generator.** If your document still comes from `Swashbuckle.AspNetCore.SwaggerGen`, point its endpoint at the route Scalar expects and drop `UseSwaggerUI()`:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

if (app.Environment.IsDevelopment())
{
    app.MapSwagger("/openapi/{documentName}.json");
    app.MapScalarApiReference();
}
```

Your XML comments, filters and attributes keep working because the generator has not changed. The same pattern applies to NSwag (`app.UseOpenApi(options => options.Path = "/openapi/{documentName}.json")`) and FastEndpoints. If your document lives somewhere else, call `options.WithOpenApiRoutePattern("/swagger/{documentName}/swagger.json")` instead of moving it.

**Moving to Microsoft.AspNetCore.OpenApi.** If you are upgrading to .NET 9 or 10 anyway, replace `AddSwaggerGen()` with `AddOpenApi()` and `UseSwagger()` with `MapOpenApi()`, then follow the three steps above.

**Coming from Redoc?** Redoc renders a read-only reference. Scalar adds the request client in the same page, so readers can try an endpoint without switching tools. The [Swagger UI migration guide](/resources/migration/swagger-ui) has a feature-by-feature comparison.

## Frequently asked questions

<scalar-detail title="Is Scalar a Swashbuckle alternative?">

It replaces the UI half of Swashbuckle, which is Swagger UI. Swashbuckle also generates the OpenAPI document; for that half, you can keep Swashbuckle's generator or move to Microsoft's built-in `Microsoft.AspNetCore.OpenApi`. `Scalar.AspNetCore` works with both, and with NSwag and FastEndpoints.

</scalar-detail>

<scalar-detail title="What is the .NET 9 OpenAPI UI?">

.NET 9 generates OpenAPI documents with `Microsoft.AspNetCore.OpenApi` but ships no UI to view them. Microsoft Learn describes adding Swagger UI or Scalar yourself. With Scalar, that is `dotnet add package Scalar.AspNetCore` and `app.MapScalarApiReference()`.

</scalar-detail>

<scalar-detail title="Does Scalar.AspNetCore work with .NET 8 and .NET 10?">

Yes. The package targets .NET 8, 9 and 10. On .NET 8, generate the document with Swashbuckle or NSwag and map it to `/openapi/{documentName}.json`. On .NET 9 and 10, use `AddOpenApi()` and `MapOpenApi()` as shown above.

</scalar-detail>

<scalar-detail title="Is Scalar.AspNetCore free?">

Yes. The package and the API reference it renders are open source under the MIT license, and running it inside your app costs nothing. Paid plans cover hosted docs with more APIs and seats, SDKs, and MCP usage.

</scalar-detail>

<scalar-detail title="Should I expose Scalar in production?">

Only if the API documentation is meant to be public. Microsoft's guidance is to enable OpenAPI UIs in development. For public docs, many teams publish the document to Scalar and host the reference separately instead of serving it from the API process.

</scalar-detail>

<scalar-detail title="How do I add authentication to the reference?">

Define security schemes in your OpenAPI generator first, then pre-fill them for development with methods such as `.AddPreferredSecuritySchemes("BearerAuth")` and `.AddHttpAuthentication(...)`. The [integration guide](/products/api-references/integrations/aspnetcore/integration) covers API key, HTTP and every OAuth 2.0 flow.

</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI vs Swagger](/learn/openapi/openapi-vs-swagger)
- **Docs:** [ASP.NET Core integration guide](/products/api-references/integrations/aspnetcore/integration)
- **Product:** [API References](/products/api-references) — the open-source reference behind `Scalar.AspNetCore`, also available hosted
