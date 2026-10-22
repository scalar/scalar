# Multiple OpenAPI Documents

## Understanding OpenAPI Documents with API Versioning

When working with versioned APIs, generate separate OpenAPI documents for each version. This guide assumes you have API versioning configured using `Microsoft.AspNetCore.Mvc.Versioning` and `Microsoft.AspNetCore.Mvc.Versioning.ApiExplorer`.

Your existing code may look like this:

```csharp
services.AddApiVersioning().AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
```

## Configuring OpenAPI Generation

To generate separate OpenAPI documents for each API version, configure the OpenAPI document generator as follows:

```csharp
string[] versions = ["v1", "v2"];

foreach (var version in versions)
{
  builder.Services.AddOpenApi(version, options =>
  {
    // Add the appropriate API version information to the document
    options.AddDocumentTransformer((document, context, _) =>
    {
      var descriptionProvider = context.ApplicationServices.GetRequiredService<IApiVersionDescriptionProvider>();
      var versionDescription = descriptionProvider.ApiVersionDescriptions.FirstOrDefault(x => x.GroupName == version);
      document.Info.Version = versionDescription?.ApiVersion.ToString();
      return Task.CompletedTask;
    });

    // Indicate if the API is deprecated
    options.AddOperationTransformer((operation, context, _) =>
    {
      var apiDescription = context.Description;
      operation.Deprecated = apiDescription.IsDeprecated();
      return Task.CompletedTask;
    });
  });
}
```

## Integrating with Scalar.AspNetCore

To configure the Scalar API Reference to use multiple OpenAPI documents, use either the `AddDocument` or `AddDocuments` methods. Here are different approaches:

1. Using `AddDocument`

```csharp
app.MapScalarApiReference(options =>
{
    // Default route pattern: /openapi/{documentName}.json. Only document name is required, title and routePattern are optional
    options.AddDocument("v1");
    
    // Skip title and only specify routePattern
    options.AddDocument("v2", routePattern: "/api-docs/{documentName}/spec.json");
    
    // All parameters specified
    options.AddDocument("v3", "Version 3.0", "/api-documentation/v3.json");

    // Skip title but provide routePattern
    options.AddDocument("external", routePattern: "https://api.example.com/v1/openapi.json");
});
```

2. Using `AddDocuments`

```csharp
string[] versions = ["v1", "v2", "v3"];

app.MapScalarApiReference(options =>
{
    // Adds multiple documents using default route patterns
    options.AddDocuments(versions);

    // Alternative syntax for multiple documents
    options.AddDocuments("v4", "v5", "v6");
});
```

3. Using `AddDocuments` with `ScalarDocument`

```csharp
var documents =
[
    new ScalarDocument("v1", "Production API", "api/v1/spec.json"),
    new ScalarDocument("v2-beta", "Beta API", "beta/openapi.json"),
    new ScalarDocument("v3-dev", "Development API", "dev/specs/{documentName}.json")
];

app.MapScalarApiReference(options => options.AddDocuments(documents));
```

4. Using the Options Pattern

```csharp
builder.Services.Configure<ScalarOptions>(options =>
{
    // Method chaining with AddDocument
    options
      .AddDocument("v1", "Production API")
      .AddDocument("v2-beta", "Beta API", "beta/openapi.json");
});
```

The `routePattern` parameter allows you to customize how the OpenAPI document is served. If not specified, it uses the default pattern from `ScalarOptions.OpenApiRoutePattern`. The pattern can include the `{documentName}` placeholder which will be replaced with the document name.


A full example code may look like this:

```csharp
string[] versions = ["v1", "v2"];

foreach (var version in versions)
{
  builder.Services.Configure<ScalarOptions>(options => options.AddDocument(version));
  builder.Services.AddOpenApi(version, options =>
  {
    // Add the appropriate API version information to the document
    options.AddDocumentTransformer((document, context, _) =>
    {
      var descriptionProvider = context.ApplicationServices.GetRequiredService<IApiVersionDescriptionProvider>();
      var versionDescription = descriptionProvider.ApiVersionDescriptions.FirstOrDefault(x => x.GroupName == version);
      document.Info.Version = versionDescription?.ApiVersion.ToString();
      return Task.CompletedTask;
    });

    // Indicate if the API is deprecated
    options.AddOperationTransformer((operation, context, _) =>
    {
      var apiDescription = context.Description;
      operation.Deprecated = apiDescription.IsDeprecated();
      return Task.CompletedTask;
    });
  });
}
```


With this setup, Scalar will display a version selector in the UI, allowing users to switch between different API versions and their corresponding documentation.

## Per-document authentication

Authentication configured on `ScalarOptions` is shared by all documents. Use the document callback to override those defaults for one document:

```csharp
app.MapScalarApiReference(options => options
    .AddAuthorizationCodeFlow("OAuth", flow => flow.ClientId = "shared-client")
    .AddHttpAuthentication("Basic", auth => auth.Username = "demo")
    .AddDocument("public", configureDocument: document => document
        .AddPreferredSecuritySchemes("OAuth")
        .WithAllowedSecuritySchemes("OAuth"))
    .AddDocument("internal", configureDocument: document => document
        .AddPreferredSecuritySchemes("Basic")
        .AddHttpAuthentication("Basic", auth => auth.Username = "internal-demo")
        .WithAllowedSecuritySchemes("Basic")));
```

Define the corresponding security schemes in each API description. The public document displays OAuth with the shared client ID. The internal document displays Basic with its document-specific username.

Document authentication settings merge recursively with global defaults. Document values win, and arrays (including preferred schemes and allowed schemes) replace global arrays. Documents without overrides inherit the global configuration. You can also set `Authentication` directly on a `ScalarDocument` passed to `AddDocuments`.

`WithAllowedSecuritySchemes` limits authentication choices and forms in the reference and its request modal. Omitting it shows all inherited and document-defined schemes. Calling it without names hides all choices. An allowlist also hides generic authentication creation, and an AND combination is hidden if any member is excluded.

The allowlist only controls visibility. It does not change the API description, server authorization, or credentials sent with requests, including saved selections. Configure the preferred scheme consistently with the allowlist. Existing user selections take precedence over the preferred scheme.
