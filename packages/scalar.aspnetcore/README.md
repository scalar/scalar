# Scalar .NET API Reference Integration

This .NET package `Scalar.AspNetCore` provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger. Made possible by the wonderful work of [captainsafia](https://github.com/captainsafia) on [building the integration & docs written](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/aspnetcore-openapi?view=aspnetcore-9.0&tabs=visual-studio#using-scalar-for-interactive-api-documentation) for the Scalar & .NET integration.

![dotnet](./dotnet.jpg)

## 🚀 Getting Started

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
// Fluent api
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

## Building & Release

```bash
dotnet build
dotnet pack --configuration Release
# then ping marc until we set up ci auto release!
```
