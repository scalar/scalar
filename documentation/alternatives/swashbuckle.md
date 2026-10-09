# Best Swashbuckle alternatives for .NET (2026)

*Last updated: September 2026*

Since .NET 9, ASP.NET Core generates OpenAPI documents itself, so replacing Swashbuckle usually means `Microsoft.AspNetCore.OpenApi` for the document and a separate UI such as Scalar for the documentation page.

That split is the key to this whole topic. Swashbuckle is two things in one package: a generator (`Swashbuckle.AspNetCore.SwaggerGen`) that turns your controllers and minimal APIs into an OpenAPI document, and a UI (`Swashbuckle.AspNetCore.SwaggerUI`) that serves Swagger UI on `/swagger`. You can replace either half, or both. This guide walks through the options for each, with Program.cs you can paste.

We make Scalar, and `Scalar.AspNetCore` is one of the options, so we list it first. Every claim about another project links to Microsoft Learn, GitHub or the project's own docs.

## What changed, and why people went looking

In March 2024 the ASP.NET Core team [announced that Swashbuckle was being removed from the .NET 9 web API template](https://github.com/dotnet/aspnetcore/issues/54599). The reason given was that the project was "no longer actively maintained by its community owner" and had no official release for .NET 8 at the time. The team said it would extend `Microsoft.AspNetCore.OpenApi` instead, and pointed to NSwag as another option. The announcement collected more than 270 reactions and a long discussion, which is a fair measure of how many teams it affected.

Two things happened next, and both matter for your decision.

**Microsoft's generator grew up.** `Microsoft.AspNetCore.OpenApi` shipped with .NET 9, and in .NET 10 the [default OpenAPI version for generated documents is 3.1](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0), with YAML output available from the endpoint. It deliberately does not ship a UI. Microsoft Learn's page on using generated documents covers two ways to add one: [Swagger UI through `Swashbuckle.AspNetCore.SwaggerUi`, and a section titled "Use Scalar for interactive API documentation"](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents).

**Swashbuckle came back.** New maintainers picked the project up. Releases resumed, [v10.0.0 arrived in November 2025](https://github.com/domaindrivendev/Swashbuckle.AspNetCore/releases/tag/v10.0.0), and the current line can [emit OpenAPI 3.1 as well as 3.0 and Swagger 2.0](https://github.com/domaindrivendev/Swashbuckle.AspNetCore). So "Swashbuckle is dead" is out of date. The honest reasons to move in 2026 are different:

- **New projects start without it.** The .NET 9 and 10 templates use `builder.Services.AddOpenApi()`. Keeping Swashbuckle means maintaining a second way of doing something the framework now does.
- **v10 was a breaking upgrade.** Moving to Swashbuckle 10 meant [upgrading Microsoft.OpenApi to 2.x](https://github.com/domaindrivendev/Swashbuckle.AspNetCore), which touches custom filters. Many teams used that moment to ask whether to migrate to the built-in generator instead.
- **The UI is still Swagger UI.** If the complaint is the docs page rather than the document, a newer Swashbuckle does not change it. See our [Swagger UI alternatives](/alternatives/swagger-ui) guide for that side of the story.

## Your options at a glance

| Option | Replaces | License | OpenAPI output | UI | Best for |
| --- | --- | --- | --- | --- | --- |
| **Scalar.AspNetCore** | The UI | [MIT](https://github.com/scalar/scalar) | Uses any generator's document | Scalar reference with API client | A modern docs page on any generator |
| [Microsoft.AspNetCore.OpenApi](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi) | The generator | MIT | 3.1 default in .NET 10, 3.0 | None built in | New projects on .NET 9 and later |
| [NSwag](https://github.com/RicoSuter/NSwag) | Both, plus clients | MIT | [Swagger 2.0 and OpenAPI 3.0](https://github.com/RicoSuter/NSwag) | Swagger UI or ReDoc | Teams that also generate C# or TypeScript clients |
| [Swashbuckle SwaggerUI only](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents) | The generator, keeping the UI | MIT | From Microsoft's generator | Swagger UI | Keeping the familiar page, dropping SwaggerGen |
| [Swashbuckle.AspNetCore.ReDoc](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) | The UI | MIT | Any | Redoc (read-only) | Read-only public references |
| [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview) | Client generation | MIT | Consumes documents | None | Generating typed API clients from your document |

Checked against Microsoft Learn and each project's GitHub repository on 26 September 2026.

## The options

### 1. Scalar.AspNetCore

[`Scalar.AspNetCore`](https://www.nuget.org/packages/Scalar.AspNetCore) is a NuGet package that serves the Scalar API reference from your app. It works with whatever produces your document: Microsoft.AspNetCore.OpenApi, Swashbuckle's SwaggerGen, NSwag or FastEndpoints. The UI assets ship inside the package, so nothing loads from a CDN unless you ask it to. Every operation opens a full API client with authentication prefill (API key, bearer, basic, OAuth 2.0 flows), code examples including C# `HttpClient`, dark mode, search, and a classic layout if your team prefers the Swagger UI shape.

With the built-in generator (the path Microsoft Learn documents):

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

Keeping Swashbuckle's generator and swapping only the UI:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

if (app.Environment.IsDevelopment())
{
    app.MapSwagger("/openapi/{documentName}.json");
    app.MapScalarApiReference();
}
```

Browse to `/scalar`. To open it on F5, set `"launchUrl": "scalar"` in `Properties/launchSettings.json`. There is also an [Aspire integration](/products/api-references/integrations/aspire) if you want one reference for every service in an Aspire app host.

**Verdict:** the change .NET teams notice most for the least code, whichever generator you keep.
**Best for:** any ASP.NET Core API that wants a better docs page than Swagger UI.

### 2. Microsoft.AspNetCore.OpenApi

The built-in generator is the default for new projects and the one the ASP.NET Core team maintains alongside the framework. It supports [document, operation and schema transformers](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/customize-openapi) for the customisation Swashbuckle filters used to handle, build-time generation through `Microsoft.Extensions.ApiDescription.Server`, and in .NET 10 an injectable `IOpenApiDocumentProvider` for reading documents outside a request. It needs a UI from somewhere else, which is where options 1, 4 and 5 come in.

**Verdict:** the sensible default generator for .NET 9 and later.
**Best for:** new projects, and existing ones willing to port Swashbuckle filters to transformers.

### 3. NSwag

[NSwag](https://github.com/RicoSuter/NSwag) combines document generation, a UI (Swagger UI or ReDoc), and client generation for C# and TypeScript in one toolchain, with a CLI, MSBuild targets and the NSwagStudio GUI. Its README describes it as a Swagger 2.0 and OpenAPI 3.0 toolchain. The repository has around 1,950 open issues, so check that the ones touching your scenario are not blockers.

**Verdict:** the most complete single package, if its OpenAPI version support is enough for you.
**Best for:** teams that generate C# or TypeScript clients from the same pipeline that documents the API.

### 4. Swashbuckle's SwaggerUI package on its own

Microsoft Learn's own example pairs `AddOpenApi()` with `app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "v1"))` from `Swashbuckle.AspNetCore.SwaggerUi`. You drop SwaggerGen and keep the exact page your team knows.

**Verdict:** the zero-surprise migration for the UI, with all of Swagger UI's limits intact.
**Best for:** internal APIs where nobody wants the docs page to change.

### 5. Redoc through Swashbuckle.AspNetCore.ReDoc

Swashbuckle also publishes a [ReDoc package](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) that serves Redoc instead of Swagger UI. The open-source Redoc renders a clean three-panel reference but [has no request console](https://github.com/Redocly/redoc#redoc-vs-hosted-redoc).

**Verdict:** a good read-only page; readers cannot try calls.
**Best for:** published, stable APIs. See [Redoc alternatives](/alternatives/redoc).

### 6. Kiota for the client side

Some teams used Swashbuckle-era tooling to generate clients as well. Microsoft's [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview) generates API clients from an OpenAPI document in C#, Go, Java, PHP, Python, Ruby and TypeScript. If you want published, idiomatic SDKs with release automation instead, Scalar's [SDK generator](/products/sdk-generator) reads the same document; TypeScript, Python, Go, Java, Kotlin, and Ruby are generally available and C# is experimental.

**Verdict:** a solid free choice for typed clients.
**Best for:** consumers who need a client for an API they call, rather than a publisher shipping SDKs.

## Mapping Swashbuckle UI options to Scalar

If you customised `UseSwaggerUI`, most settings have a direct equivalent in `MapScalarApiReference`.

| Swashbuckle SwaggerUI | Scalar.AspNetCore |
| --- | --- |
| `options.RoutePrefix = "docs"` | `app.MapScalarApiReference("/docs")` |
| `options.DocumentTitle = "My API"` | `options.WithTitle("My API")` |
| `options.SwaggerEndpoint(...)` for several versions | `options.AddDocument("v1")`, `options.AddDocument("v2")` |
| `options.EnablePersistAuthorization()` | `options.EnablePersistentAuthentication()` |
| `options.OAuthClientId("...")` | `options.AddAuthorizationCodeFlow("OAuth2", flow => flow.ClientId = "...")` |
| `options.DefaultModelsExpandDepth(-1)` | `options.HideModels()` |
| `options.DisplayOperationId()` | `options.ShowOperationId()` |
| `options.SupportedSubmitMethods()` (none) | `options.HideTestRequestButton()` |
| `options.InjectStylesheet("/custom.css")` | `options.WithCustomCss("...")` |

The full option list is in the [ASP.NET Core integration docs](/products/api-references/integrations/aspnetcore/integration).

## When to stay on Swashbuckle

- **You have a lot of custom `IOperationFilter` and `ISchemaFilter` code.** Porting it to transformers is real work, and Swashbuckle is maintained again. You can keep SwaggerGen and still change the UI with option 1.
- **You depend on Swashbuckle's annotations package or XML comment handling** in ways the built-in generator does not match yet. Test your document side by side before switching generators.
- **You are on .NET 8 and not upgrading soon.** `Microsoft.AspNetCore.OpenApi` document generation arrived with .NET 9. On .NET 8, Swashbuckle or NSwag remain the practical generators.
- **Your OpenAPI document is part of a contract.** If partners diff your document, a generator swap will change it in small ways. Plan that change on purpose.

## Frequently asked questions

<scalar-detail title="Why was Swashbuckle removed from .NET 9?">
The ASP.NET Core team said in March 2024 that the project was no longer actively maintained and had no official .NET 8 release. They removed it from the web API template and extended Microsoft.AspNetCore.OpenApi instead. Swashbuckle has since been maintained again, but the templates still use the built-in generator.
</scalar-detail>

<scalar-detail title="Is Swashbuckle deprecated?">
No. It is no longer in the default templates, but it is actively released. Version 10 added OpenAPI 3.1 output. Whether to keep it is a choice about consistency with the framework, not about abandonment.
</scalar-detail>

<scalar-detail title="How do I add Swagger UI or Scalar to a .NET 9 or .NET 10 project?">
Call `builder.Services.AddOpenApi()` and `app.MapOpenApi()`, then add a UI package. For Scalar, install `Scalar.AspNetCore` and call `app.MapScalarApiReference()`; for Swagger UI, install `Swashbuckle.AspNetCore.SwaggerUi` and call `app.UseSwaggerUI()` pointing at `/openapi/v1.json`. Microsoft Learn documents both.
</scalar-detail>

<scalar-detail title="Should the docs UI be enabled in production?">
Microsoft's guidance is that OpenAPI user interfaces, including Swagger UI, ReDoc and Scalar, should only be enabled in development environments, to limit information disclosure. If your API is public and the reference is meant for customers, publish it deliberately, for example as a hosted reference built from the document at build time.
</scalar-detail>

<scalar-detail title="Does Microsoft.AspNetCore.OpenApi support OpenAPI 3.1?">
Yes. In .NET 10 generated documents default to OpenAPI 3.1, and you can set `OpenApiVersion` in `AddOpenApi` options to choose a different version.
</scalar-detail>

<scalar-detail title="Can I use Scalar with NSwag or FastEndpoints?">
Yes. Scalar reads the document from a route pattern, `/openapi/{documentName}.json` by default. Configure NSwag or FastEndpoints to serve the document there, then call `app.MapScalarApiReference()`. The integration docs include both setups.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0)
- **Docs:** [Scalar for ASP.NET Core](/products/api-references/integrations/aspnetcore/integration)
- **Product:** [Scalar API References](/products/api-references) — the reference Microsoft Learn documents for .NET, free and MIT licensed. For a full .NET walkthrough, see [.NET API documentation](/docs-for/dotnet).

---

*This page is based on Microsoft Learn, the dotnet/aspnetcore announcement on GitHub, and the public repositories and documentation of Swashbuckle, NSwag, Redoc and Kiota, as of 26 September 2026. .NET tooling changes with every release. We have made a genuine effort to be accurate and fair. If you find something wrong or out of date, please [open an issue](https://github.com/scalar/scalar/issues) and we will correct it.*
