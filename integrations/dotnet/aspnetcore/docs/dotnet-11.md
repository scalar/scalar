# .NET 11 preview support

`Scalar.AspNetCore.Microsoft` targets .NET 9, .NET 10, and .NET 11 RC1. The generator dependencies are selected for each target:

| Target      | Microsoft.AspNetCore.OpenApi | Microsoft.OpenApi |
| ----------- | ---------------------------- | ----------------- |
| .NET 9      | 9.x                          | 1.x               |
| .NET 10     | 10.x                         | 2.x               |
| .NET 11 RC1 | 11.0.0-rc.1.26425.128        | 3.x               |

Do not upgrade Microsoft.OpenApi to 3.x in an app using the .NET 9 or .NET 10 Microsoft generator.

ASP.NET Core 11 generates OpenAPI 3.2 documents by default. To keep OpenAPI 3.1 output for other tools, configure the generator explicitly:

```csharp
builder.Services.AddOpenApi(options =>
{
    options.OpenApiVersion = Microsoft.OpenApi.OpenApiSpecVersion.OpenApi3_1;
    options.AddScalarTransformers();
});
```

This changes the document format. It does not change the Microsoft.OpenApi dependency version.

`Scalar.AspNetCore` continues to use its .NET 10 assembly on .NET 11. `Scalar.AspNetCore.Swashbuckle` remains on its existing dependencies while upstream support for Microsoft.OpenApi 3.x is pending.

## Building and releasing

The repository uses the .NET 11 RC1 SDK in `integrations/dotnet/global.json`. Keep the .NET 8, 9, and 10 runtimes installed to run tests for the older targets.

Publish this support as a prerelease while it depends on ASP.NET Core 11 RC1. Before a stable release, update the RC1 SDK and package references to the final .NET 11 versions.
