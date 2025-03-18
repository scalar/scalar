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

To configure the Scalar API Reference to use multiple OpenAPI documents, use either the `AddDocument` or `AddDocuments` methods. Here are two approaches:

1. Using the Options Pattern

Extend the foreach loop from above to update the `ScalarOptions` accordingly:

```csharp
string[] versions = ["v1", "v2"];

foreach (var version in versions)
{
  builder.Services.Configure<ScalarOptions>(options => options.AddDocument(version));
  builder.Services.AddOpenApi(version, options =>
  {
    // Existing configuration
  });
}
```

2. Using the `MapScalarApiReference` Overload

```csharp
string[] versions = ["v1", "v2"];

app.MapScalarApiReference(options => options.AddDocuments(versions));
// or
app.MapScalarApiReference(options => options.AddDocuments("v1", "v2"));
```

With this setup, Scalar will display a version selector in the UI, allowing users to switch between different API versions and their corresponding documentation.
