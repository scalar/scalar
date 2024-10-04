# Scalar .NET API Reference Integration

[![Version](https://img.shields.io/nuget/v/Scalar.AspNetCore)](https://www.nuget.org/packages/Scalar.AspNetCore)
[![Downloads](https://img.shields.io/nuget/dt/Scalar.AspNetCore)](https://www.nuget.org/packages/Scalar.AspNetCore)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This .NET package `Scalar.AspNetCore` provides an easy way to render beautiful API references based on OpenAPI/Swagger documents.

Made possible by the wonderful work of [@captainsafia](https://github.com/captainsafia) on [building the integration and docs written](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents?view=aspnetcore-9.0#use-scalar-for-interactive-api-documentation) for the Scalar & .NET integration. Thanks to [@xC0dex](https://github.com/xC0dex) for making it awesome.

![dotnet](./dotnet.jpg)

## Usage

1. **Install the package**

```shell
dotnet add package Scalar.AspNetCore
```

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

The `MapScalarApiReference` method has an optional parameter that you can use to customize the behavior of the Scalar UI:

```csharp
// Fluent API
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("My custom API")
        .WithTheme(ScalarTheme.Mars)
        .WithSidebar(false)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
        .WithPreferredScheme("ApiKey")
        .WithApiKeyAuthentication(x => x.Token = "my-api-key");
});

// Object initializer
app.MapScalarApiReference(options =>
{
    options.Title = "My custom API";
    options.Theme = ScalarTheme.Mars;
    options.ShowSidebar = false;
    options.DefaultHttpClient = new(ScalarTarget.CSharp, ScalarClient.HttpClient);
    options.Authentication = new ScalarAuthenticationOptions
    {
        PreferredSecurityScheme = "ApiKey",
        ApiKey = new ApiKeyOptions
        {
            Token = "my-api-key"
        }
    };
});
```

For more possible options and their default values, check out the [ScalarOptions.cs](src/Scalar.AspNetCore/Options/ScalarOptions.cs) class.

It is also possible to configure the options via dependency injection, using the options pattern:

```csharp
builder.Services.Configure<ScalarOptions>(options => options.Title = "My custom API");
// or
builder.Services.AddOptions<ScalarOptions>().BindConfiguration("Scalar");
```

> [!NOTE]
> Options which are set via the `MapScalarApiReference` method will take precedence over options set via dependency injection.

## Development

1. Download [.NET 9.0](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
2. Jump to the package folder: `cd packages/scalar.aspnetcore`
3. Do a fresh build: `dotnet build`
4. Run the tests: `dotnet test`

And see it in action here:

1. Switch to the playground: `cd playground`
2. Start the playground: `dotnet run`
3. Open this URL in the browser: <http://localhost:5056/scalar/v1>

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/openapi-parser/blob/main/LICENSE).
