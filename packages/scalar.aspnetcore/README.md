# Scalar .NET API Reference Integration

[![Version](https://img.shields.io/nuget/v/Scalar.AspNetCore)](https://www.nuget.org/packages/Scalar.AspNetCore)
[![Downloads](https://img.shields.io/nuget/dt/Scalar.AspNetCore)](https://www.nuget.org/packages/Scalar.AspNetCore)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This .NET package `Scalar.AspNetCore` provides an easy way to render beautiful API references based on OpenAPI/Swagger documents.

Made possible by the wonderful work of [@captainsafia](https://github.com/captainsafia) on [building the integration and docs written](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents?view=aspnetcore-9.0#use-scalar-for-interactive-api-documentation) for the Scalar & .NET integration. Thanks to [@xC0dex](https://github.com/xC0dex) for making it awesome.

![dotnet](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/dotnet.jpg)

## Usage

1. **Install the package**

```shell
dotnet add package Scalar.AspNetCore --version 1.2.*
```

> [!NOTE]
> We release new versions frequently to bring you the latest features and bug fixes. To reduce the noise in your project file, we recommend using a wildcard for the patch version, e.g., `1.2.*`.

2. **Add the using directive**

```csharp
using Scalar.AspNetCore;
```

3. **Configure your application**

Add the following lines to your `Program.cs` for .NET 9:

```csharp
builder.Services.AddOpenApi();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
```

or for .NET 8 with Swashbuckle:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.RouteTemplate = "openapi/{documentName}.json";
    });
    app.MapScalarApiReference();
}
```

That's it! 🎉 Now you will see the Scalar UI when using the defaults by navigating to `/scalar/v1` in your browser.

## Configuration

For a full configuration guide, including OAuth integration and custom settings, refer to the [dotnet integration documentation](https://github.com/scalar/scalar/blob/main/documentation/integrations/dotnet.md).

## Development

1. Download [.NET 9.0](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
2. Jump to the package folder: `cd packages/scalar.aspnetcore`
3. Do a fresh build: `dotnet build`
4. Run the tests: `dotnet test`

And see it in action here:

1. Switch to the playground: `cd playground/Scalar.AspNetCore.Playground`
2. Start the playground: `dotnet run`
3. Open this URL in the browser: <http://localhost:5056/scalar/v1>

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
