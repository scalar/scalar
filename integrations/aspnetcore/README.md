# Scalar .NET API Reference Integration

[![Version](https://img.shields.io/nuget/v/Scalar.AspNetCore)](https://www.nuget.org/packages/Scalar.AspNetCore)
[![Downloads](https://img.shields.io/nuget/dt/Scalar.AspNetCore)](https://www.nuget.org/packages/Scalar.AspNetCore)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This .NET package `Scalar.AspNetCore` provides an easy way to render beautiful API references based on OpenAPI/Swagger documents.

Made possible by the wonderful work of [@captainsafia](https://github.com/captainsafia) on [building the integration and docs written](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents?view=aspnetcore-9.0#use-scalar-for-interactive-api-documentation) for the Scalar & .NET integration. Thanks to [@xC0dex](https://github.com/xC0dex) for making it awesome.

## Features

- Stunning API Reference
- Compatible with .NET 8 and above
- Independent of OpenAPI document generators
- Fully AOT (Ahead-of-Time) compatible

![dotnet](https://raw.githubusercontent.com/scalar/scalar/refs/heads/main/integrations/aspnetcore/dotnet.jpg)

## Migration Guide

If you are upgrading from `2.1.x` to `2.2.x`, please refer to the [migration guide](https://github.com/scalar/scalar/discussions/5468).
If you are upgrading from `1.x.x` to `2.x.x`, please refer to the [migration guide](https://github.com/scalar/scalar/issues/4362).

## Usage

1. **Install the package**

```shell
dotnet add package Scalar.AspNetCore --version 2.1.*
```

> [!NOTE]
> We release new versions frequently to bring you the latest features and bug fixes. To reduce the noise in your project file, we recommend using a wildcard for the patch version, e.g., `2.1.*`.

2. **Add the using directive**

```csharp
using Scalar.AspNetCore;
```

3. **Configure your application**

Add the following to `Program.cs` based on your OpenAPI generator:

For `Microsoft.AspNetCore.OpenApi`:

```csharp
builder.Services.AddOpenApi();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
```

For `Swashbuckle`:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.RouteTemplate = "/openapi/{documentName}.json";
    });
    app.MapScalarApiReference();
}
```

For `NSwag`:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApiDocument();

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi(options =>
    {
        options.Path = "/openapi/{documentName}.json";
    });
    app.MapScalarApiReference();
}
```

For `FastEndpoints`:

```csharp
builder.Services.SwaggerDocument();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen(options =>
    {
        options.Path = "/openapi/{documentName}.json";
    });
    app.MapScalarApiReference();
}
```

That's it! 🎉 You can now access the Scalar API Reference at `/scalar`. By default, the API Reference uses the `v1` document. You can add documents by calling the `AddDocument` method. Alternatively, you can navigate to `/scalar/{documentName}` (e.g., `/scalar/v1`) to view the API Reference for a specific document. Please check out the [dotnet integration documentation](https://github.com/scalar/scalar/blob/main/documentation/integrations/dotnet.md#multiple-openapi-documents) for more details.

## Configuration

For detailed configuration options, refer to the [integration documentation](https://github.com/scalar/scalar/blob/main/documentation/integrations/dotnet.md). This documentation focuses on the features provided by the package.

For more realistic examples and advanced usage scenarios, such as authentication, API versioning, and handling multiple documents, check out our [extended examples documentation](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/docs/README.md). This documentation is also useful if you need more context on what `Scalar.AspNetCore` is for.

## Development

### Local

1. Download [.NET 9.0](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
2. Jump to the package folder: `cd integrations/aspnetcore`
3. Do a fresh build: `dotnet build`
4. Run the tests: `dotnet test`

And see it in action here:

1. Switch to the playground: `cd playground/Scalar.AspNetCore.Playground`
2. Start the playground: `dotnet run`
3. Open this URL in the browser: <http://localhost:5056/scalar/>

### Docker

If you don't have the SDK installed or want to run the playground under a subpath, you can use Docker Compose:

1. Run Docker Compose: `docker compose up --build`
2. Open this URL in the browser: <http://localhost:8080/api/scalar/>

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
