# .NET Integration

The `Scalar.AspNetCore` package provides a simple way to integrate the Scalar API reference into your .NET 8+ application.

## Basic Setup

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

Add the following to `Program.cs` based on your OpenAPI generator:

For .NET 9 using `Microsoft.AspNetCore.OpenApi`:

```csharp
builder.Services.AddOpenApi();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
```

For .NET 8 using `Swashbuckle`:

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

For .NET 8 using `NSwag`:

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

That’s it! 🎉 With the default settings, you can now access the Scalar API reference at `/scalar/v1` in your browser, where `v1` is the default document name.

## Configuration Options

The `MapScalarApiReference` method accepts an optional `options` parameter, which you can use to customize Scalar using the fluent API or object initializer syntax:

```csharp
app.MapScalarApiReference(options =>
{
    // Fluent API
    options
        .WithTitle("Custom API")
        .WithSidebar(false);

    // Object initializer
    options.Title = "Custom API";
    options.ShowSidebar = false;
});
```

### Authentication

Scalar supports various authentication schemes, including OAuth and API Key, by allowing you to pre-fill certain authentication details.

> [!WARNING]
> Sensitive Information: Pre-filled authentication details are exposed to the client/browser and may pose a security risk. Do not use this feature in production environments.

> [!NOTE]
> The available security schemes and flows are defined in the OpenAPI document your app provides, not within Scalar itself.

#### API Key

To simplify API key usage, you can provide a token:

```csharp
app.MapScalarApiReference(options =>
{
    // Fluent API
    options
        .WithPreferredScheme("ApiKey") // Security scheme name from the OpenAPI document
        .WithApiKeyAuthentication(apiKey =>
        {
            apiKey.Token = "your-api-key";
        });

    // Object initializer
    options.Authentication = new ScalarAuthenticationOptions
    {
        PreferredSecurityScheme = "ApiKey", // Security scheme name from the OpenAPI document
        ApiKey = new ApiKeyOptions
        {
            Token = "your-api-key"
        }
    }
});
```

#### OAuth

Similarly, you can pre-fill OAuth fields like the client ID and scopes:

```csharp
app.MapScalarApiReference(options =>
{
    options
        .WithPreferredScheme("OAuth2") // Security scheme name from the OpenAPI document
        .WithOAuth2Authentication(oauth =>
        {
            oauth.ClientId = "your-client-id";
            oauth.Scopes = ["profile"];
        });
});
```

### OpenAPI Document

Scalar expects the OpenAPI document to be located at `/openapi/{documentName}.json`, matching the route of the built-in .NET OpenAPI generator in the `Microsoft.AspNetCore.OpenApi` package. If the document is located elsewhere (e.g., when using `Swashbuckle` or `NSwag`), specify the path using the `OpenApiRoutePattern` property:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithOpenApiRoutePattern("/swagger/{documentName}.json");
    // or
    options.OpenApiRoutePattern = "/swagger/{documentName}.json";
});
```

### API Reference Route

The Scalar API reference is initially accessible at `/scalar/{documentName}`. Customize this route using the `EndpointPathPrefix` property:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithEndpointPrefix("/api-reference/{documentName}");
    // or
    options.EndpointPathPrefix = "/api-reference/{documentName}";
});
```

### Custom HTTP Client

Scalar allows you to set a default HTTP client for code samples. The [`ScalarTarget`](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/src/Scalar.AspNetCore/Enums/ScalarTarget.cs) enum specifies the language, and the [`ScalarClient`](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/src/Scalar.AspNetCore/Enums/ScalarClient.cs) enum specifies the client type.

```csharp
app.MapScalarApiReference(options =>
{
    options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    // or
    options.DefaultHttpClient = new(ScalarTarget.CSharp, ScalarClient.HttpClient);
});
```

### Assets

Scalar uses local assets by default to render the UI. To load assets from a CDN or a different location, specify the `CdnUrl` property:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference");
    // or
    options.CdnUrl = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
});
```

> [!NOTE]
> Fonts are loaded from a CDN by default. To disable this, set `DefaultFonts` to `false`.

### Dependency Injection

Configuration options can also be set via dependency injection:

```csharp
builder.Services.Configure<ScalarOptions>(options => options.Title = "My API");
// or
builder.Services.AddOptions<ScalarOptions>().BindConfiguration("Scalar");
```

> [!NOTE]
> Options set via the `MapScalarApiReference` method override those set through dependency injection.

## Additional information

The `MapScalarApiReference` method is implemented as a minimal API endpoint and returns an `IEndpointConventionBuilder`, allowing you to use minimal API features such as authorization:

```csharp
app
  .MapScalarApiReference()
  .RequireAuthorization();
```

For all available configuration properties and their default values, check out the [`ScalarOptions`](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/src/Scalar.AspNetCore/Options/ScalarOptions.cs) and the [`ScalarOptionsExtensions`](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/src/Scalar.AspNetCore/Extensions/ScalarOptionsExtensions.cs).
