---
date: 2026-10-06
---

# OpenAPI with ASP.NET Core in .NET 9 and 10

*By Marc Laventure*

ASP.NET Core generates OpenAPI documents on its own now. Since .NET 9, the `Microsoft.AspNetCore.OpenApi` package turns your minimal APIs and controllers into an OpenAPI document at runtime or at build time, and .NET 10 moved the default output to OpenAPI 3.1 and added XML comment support. You no longer need a third-party generator to describe your API.

This is part one of a three-part series. It is deliberately vendor-neutral: everything here uses Microsoft's packages and works the same whichever documentation UI, SDK generator, or linter you point at the result. Part two covers what you can build from the document (reference docs, SDKs, an MCP server), and part three walks through one concrete setup end to end.

Every API name below was checked against the Microsoft Learn pages for [generating OpenAPI documents](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi?view=aspnetcore-10.0), [customizing them](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/customize-openapi?view=aspnetcore-10.0), [adding endpoint metadata](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/include-metadata?view=aspnetcore-10.0) and [XML comment support](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/openapi-comments?view=aspnetcore-10.0) as of September 2026.

## Why Swashbuckle stopped being the default

For most of the ASP.NET Core era, the Web API template shipped with Swashbuckle, a community project that both generated the document and served Swagger UI. In .NET 9 the ASP.NET Core team [removed it from the template](https://github.com/dotnet/aspnetcore/issues/54599) and replaced it with first-party generation in `Microsoft.AspNetCore.OpenApi`.

That split matters more than it first looks. The new package produces the document and nothing else. It does not render a UI. That is a good separation: the document is the contract, and what you do with it (docs, client generation, contract tests, linting) is a separate choice. It also means a fresh .NET 9 or 10 project has an OpenAPI endpoint and no page to look at it with, which surprises people the first time.

If you are on an existing Swashbuckle project, nothing forces you to move. Swashbuckle still works. The reasons to switch are the ones below: 3.1 output, AoT compatibility, and a transformer API maintained by the same team that ships the framework.

## .NET 9 vs .NET 10 at a glance

| | .NET 9 | .NET 10 |
| --- | --- | --- |
| Package | `Microsoft.AspNetCore.OpenApi` | `Microsoft.AspNetCore.OpenApi` |
| Default OpenAPI version | 3.0 | 3.1 |
| Version you can switch to | 2.0 | 3.0 |
| JSON Schema dialect | OpenAPI 3.0 schema subset | JSON Schema draft 2020-12 |
| Nullable types | `nullable: true` | `type: ["null", "string"]` (3.1) |
| XML doc comments | Not read | Read by a source generator |
| YAML endpoint | No | Yes, via `.yaml` route suffix |
| Object model | `Microsoft.OpenApi` 1.x (`Microsoft.OpenApi.Models`) | `Microsoft.OpenApi` 2.x (`Microsoft.OpenApi`) |

Microsoft's .NET 11 documentation already describes OpenAPI 3.2 as the default for that release. If you are reading this after .NET 11 ships, the pattern is the same; only the default changes.

## Add OpenAPI generation

Install the package:

```shell
dotnet add package Microsoft.AspNetCore.OpenApi
```

Then register the services and map the endpoint in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/", () => "Hello world!");

app.Run();
```

Run the app and open `https://localhost:{port}/openapi/v1.json`. `v1` is the default document name. The `IsDevelopment()` guard is Microsoft's recommendation, not a technical requirement: it keeps the document off production by default so you opt in to publishing it.

Two small things the generator does that are easy to miss. It excludes HTTP methods OpenAPI does not recognise (Microsoft's example is `QUERY`) rather than emitting something invalid. And it formats numbers and dates with the invariant culture, so the document is identical whatever locale your build agent runs in. That second one matters when you diff documents in CI.

## Choose the OpenAPI version

On .NET 10 you get 3.1 unless you ask otherwise. Some downstream tools still only read 3.0, and in that case you can pin it:

```csharp
builder.Services.AddOpenApi(options =>
{
    options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_0;
});
```

Our advice is to stay on 3.1 unless a specific consumer breaks. OpenAPI 3.1 aligns schemas with JSON Schema 2020-12, which is why nullable reference types come out as `type: ["null", "string"]` instead of the 3.0-only `nullable: true` keyword. Validators, generators and editors increasingly treat 3.1 as the baseline. If you want the full list of differences, we wrote them up in [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0).

On .NET 9 the default is 3.0 and there is no 3.1 option, so the only way to get 3.1 output is to upgrade.

## Serve JSON, YAML, or both

The document is served as JSON by default. On .NET 10 you can serve YAML by giving the route a `.yaml` or `.yml` suffix:

```csharp
app.MapOpenApi("/openapi/{documentName}.yaml");
```

Call `MapOpenApi()` twice if you want both. You can also move the route (`app.MapOpenApi("/openapi/{documentName}/openapi.json")`); keep the `{documentName}` parameter in it, because without it the framework falls back to a query parameter and Microsoft describes the result as unpredictable.

## Describe your endpoints properly

A generated document is only as good as the metadata it can see. Without any, you get paths and types and very little else: no summaries, no operation IDs, and response codes only where the framework can infer them. Here is what to add, roughly in order of payoff.

### Return typed results

For minimal APIs, `TypedResults` and the `Results<...>` union type carry response metadata at compile time, so the generator knows every status code an endpoint can return without you repeating it:

```csharp
app.MapGet("/books/{id}", Results<Ok<Book>, NotFound> (int id, BookStore store) =>
    store.Find(id) is Book book
        ? TypedResults.Ok(book)
        : TypedResults.NotFound());
```

This is the single most useful habit. It keeps the document honest because the compiler, not a comment, decides what the endpoint returns.

### Add summaries, descriptions, tags and operation IDs

Use the extension methods:

```csharp
app.MapGet("/books/{id}", GetBook)
    .WithName("GetBook")
    .WithSummary("Get a book by ID")
    .WithDescription("Returns a single book, or 404 if the ID is unknown.")
    .WithTags("books")
    .ProducesProblem(StatusCodes.Status500InternalServerError);
```

Or the attribute equivalents on the handler: `[EndpointName]`, `[EndpointSummary]`, `[EndpointDescription]`, `[Tags]`, and `[Description]` on parameters. `WithName` sets the `operationId`. Set it deliberately. SDK generators use it to name methods, so `GetBook` becomes `getBook()` in TypeScript and `get_book()` in Python, and changing it later is a breaking change for anybody using a generated client.

For controllers, keep using `[ProducesResponseType]` for each status code, as you did with Swashbuckle.

To hide an endpoint from the document, use `.ExcludeFromDescription()` or the `[ExcludeFromDescription]` attribute.

### Let the models describe themselves

Data annotations flow into the schema. `[Required]` marks a property as required, `[Description]` sets its description, and validation attributes such as `[MaxLength]` become schema constraints:

```csharp
public record Book(
    [property: Required]
    [property: Description("The unique identifier for the book")]
    int Id,
    [property: Description("The book title")]
    [property: MaxLength(200)]
    string Title,
    string? Subtitle);
```

On .NET 10, `Subtitle` comes out as `type: ["null", "string"]`. The generator also infers `required` from constructor parameters when a type has exactly one public constructor, which is why records often need fewer attributes than you would expect. With more than one constructor, nothing is inferred.

### Use XML comments (.NET 10)

.NET 10 reads the XML doc comments you probably already write. Enable the documentation file in the project:

```xml
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
</PropertyGroup>
```

There is no extra code. A source generator intercepts your `AddOpenApi()` calls at compile time and adds the comments as summaries, descriptions, parameter docs and response descriptions. Supported tags include `<summary>`, `<remarks>`, `<param>`, `<returns>`, `<response>`, `<example>` and `<deprecated>`.

Two gotchas from the Microsoft docs that catch people:

- A `<response code="404">` tag only *describes* a response. It does not declare one. If the endpoint's metadata does not already include a 404 (from a typed result, `Produces`, or `[ProducesResponseType]`), the comment is silently dropped.
- The source generator only recognises document names that are string literals. `AddOpenApi("v1")` works; `AddOpenApi(documentName)` with a variable gets no XML comments at all.

## Customize the document with transformers

Sometimes metadata is not enough. You need to add a security scheme, set the `info` block, stamp every operation with a header, or fix how a type maps to a schema. That is what transformers are for. There are three kinds, and they run in a fixed order: schema transformers first, then operation transformers, then document transformers.

A document transformer that sets the title and description:

```csharp
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new()
        {
            Title = "Bookstore API",
            Version = "v1",
            Description = "Books, authors and orders."
        };
        return Task.CompletedTask;
    });
});
```

An operation transformer that adds a 500 response everywhere:

```csharp
options.AddOperationTransformer((operation, context, cancellationToken) =>
{
    operation.Responses ??= new OpenApiResponses();
    operation.Responses.Add("500", new OpenApiResponse { Description = "Internal server error" });
    return Task.CompletedTask;
});
```

A schema transformer that gives `decimal` a `decimal` format instead of `double`:

```csharp
options.AddSchemaTransformer((schema, context, cancellationToken) =>
{
    if (context.JsonTypeInfo.Type == typeof(decimal))
    {
        schema.Format = "decimal";
    }
    return Task.CompletedTask;
});
```

For anything that needs services from dependency injection, implement `IOpenApiDocumentTransformer` (or the operation and schema equivalents) and register it with `AddDocumentTransformer<T>()`. Microsoft's own example uses this to read the registered authentication schemes and add a matching bearer security scheme to `components.securitySchemes`, which is the pattern to copy if your API uses JWT bearer auth. Security schemes matter downstream: documentation UIs use them to render an authentication form, and SDK generators use them to decide what the client constructor asks for.

.NET 10 also lets transformers generate a schema for any C# type with `context.GetOrCreateSchemaAsync(...)` and register it with `document.AddComponent(...)`, which is handy for adding a shared `ProblemDetails` error schema to every operation.

### Upgrading transformers from .NET 9 to .NET 10

This is the one real migration cost. .NET 10 moves to version 2 of the `Microsoft.OpenApi` object model. In practice:

- `using Microsoft.OpenApi.Models;` becomes `using Microsoft.OpenApi;`.
- Collections such as `components.securitySchemes` are typed by interface, for example `Dictionary<string, IOpenApiSecurityScheme>`.
- References use dedicated types such as `new OpenApiSecuritySchemeReference("Bearer", document)` instead of an `OpenApiReference` object on the scheme.
- Collections may be null, so initialise them (`operation.Responses ??= new OpenApiResponses();`) before adding to them.

Compare the .NET 9 and .NET 10 versions of the [customization page](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/customize-openapi?view=aspnetcore-10.0) side by side when you port a transformer; the samples are the same code in both object models.

## Generate several documents

One app can publish more than one document, for example a public and an internal API, or `v1` and `v2`:

```csharp
builder.Services.AddOpenApi("public");
builder.Services.AddOpenApi("internal", options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

app.MapGet("/books", ListBooks).WithGroupName("public");
app.MapGet("/admin/audit", GetAuditLog).WithGroupName("internal");
```

Each document is served at `/openapi/{name}.json`. By default an endpoint lands in the document whose name matches its group name, and endpoints with no group name appear in every document. Override `ShouldInclude` on the options if you need other rules. Each document gets its own transformers, so the internal one can carry auth requirements the public one does not.

## Generate the document at build time

Serving the document from a running app is fine for development. For CI you usually want a file: something you can lint, diff against the last release, commit, and hand to other tools without booting the app. Add the build-time package:

```shell
dotnet add package Microsoft.Extensions.ApiDescription.Server
```

Now `dotnet build` writes the document to the output directory. Two properties in the project file make it more useful:

```xml
<PropertyGroup>
  <OpenApiDocumentsDirectory>.</OpenApiDocumentsDirectory>
  <OpenApiGenerateDocumentsOptions>--file-name openapi</OpenApiGenerateDocumentsOptions>
</PropertyGroup>
```

`OpenApiDocumentsDirectory` is relative to the project file, so `.` writes next to your `.csproj`. `OpenApiGenerateDocumentsOptions` also accepts `--document-name v2` to emit only one document, and `--openapi-version OpenApi3_1` to pick the version at build time. YAML output at build time is not supported yet.

A caution: build-time generation runs your app's startup code to discover endpoints. If `Program.cs` connects to a database or reads secrets on startup, the build can fail on a clean agent. Microsoft's suggestion is to wrap that code in a check that `Assembly.GetEntryAssembly()?.GetName().Name` is not `"GetDocument.Insider"`, which is the entry assembly name during build-time generation.

## Common mistakes

- **Leaving operation IDs to chance.** Without `WithName`, generated names are unstable, and every SDK built from the document inherits the instability.
- **Documenting responses the endpoint never declares.** XML `<response>` tags and descriptions do nothing without response metadata. Use typed results.
- **Using a variable for the document name** on .NET 10 and wondering where the XML comments went.
- **Pinning OpenAPI 3.0 "to be safe"** and losing accurate nullability. Pin only for a consumer that needs it.
- **Serving the document publicly by accident.** If you remove the `IsDevelopment()` guard, remember `MapOpenApi()` returns a normal endpoint, so `.RequireAuthorization()` and `.CacheOutput()` work on it.
- **Never validating the output.** Run the generated file through a linter in CI. Our [Spectral rules guide](/learn/openapi/spectral-rules) covers a sensible starting ruleset.

## What to do with the document

At this point you have a correct, versioned OpenAPI document coming out of your build. On its own it is a JSON file. The value comes from what reads it:

- **A documentation UI.** Microsoft's [using OpenAPI documents](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents) page shows Swagger UI, ReDoc and Scalar, and recommends enabling any of them only in development unless you mean to publish.
- **Client SDKs** generated from the document, in C# and the languages your users actually write.
- **An MCP server** so AI agents can call the operations you choose.
- **Contract tests and breaking-change checks** that compare this build's document with the last release.

Part two of this series covers those in turn. If you want the short version for .NET today, the [.NET API documentation](/docs-for/dotnet) page shows the two-line setup, and the [ASP.NET Core integration guide](/products/api-references/integrations/aspnetcore/integration) lists every option.

## Frequently asked questions

<scalar-detail title="Do I still need Swashbuckle in .NET 9 or .NET 10?">
No. `Microsoft.AspNetCore.OpenApi` generates the document. You only need a separate package for a UI, and you can choose any UI that reads OpenAPI. Existing Swashbuckle projects keep working if you are not ready to move.
</scalar-detail>

<scalar-detail title="Which OpenAPI version does ASP.NET Core generate?">
OpenAPI 3.0 on .NET 9 and OpenAPI 3.1 on .NET 10. Set `options.OpenApiVersion` in `AddOpenApi` to change it on .NET 10.
</scalar-detail>

<scalar-detail title="Where is the OpenAPI document served?">
At `/openapi/{documentName}.json`, which is `/openapi/v1.json` for the default document. Pass a different route to `MapOpenApi()` to move it, and use a `.yaml` suffix on .NET 10 for YAML.
</scalar-detail>

<scalar-detail title="Why are my XML comments missing from the OpenAPI document?">
Check three things: `GenerateDocumentationFile` is `true`, you are on .NET 10, and the document name passed to `AddOpenApi` is a string literal. Response descriptions also need the status code to be declared by the endpoint.
</scalar-detail>

<scalar-detail title="How do I add JWT bearer authentication to the document?">
Use a document transformer that adds an HTTP bearer scheme to `components.securitySchemes`, and an operation transformer if you need to skip endpoints marked `[AllowAnonymous]`. Microsoft's customization page has a complete example.
</scalar-detail>

<scalar-detail title="Can I generate the OpenAPI document without running the app?">
Yes. Add `Microsoft.Extensions.ApiDescription.Server` and the document is written during `dotnet build`. It still executes your startup code, so guard anything that needs external resources.
</scalar-detail>

## Related

- **Learn:** [What is OpenAPI?](/learn/openapi/what-is-openapi) · [OpenAPI 3.1 vs 3.0](/learn/openapi/openapi-3-1-vs-3-0)
- **Docs:** [ASP.NET Core integration guide](/products/api-references/integrations/aspnetcore/integration)
- **Product:** [.NET API documentation](/docs-for/dotnet) — turn the document from this post into interactive docs with one NuGet package
