# Scalar.AspNetCore Integration

The `Scalar.AspNetCore` package provides a simple way to integrate the Scalar API reference into your .NET 8+ application.

## Basic Setup

To set up Scalar, use the `MapScalarApiReference` method in your `Program.cs`. See the [README](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/README.md) for general setup steps.

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

Scalar supports different authentication schemes, such as OAuth and API Key, by allowing you to provide authentication information.

> [!NOTE]
> Security schemes and flows are derived from the OpenAPI document, not defined by Scalar.

#### API Key

To simplify API key usage, you can provide a token:

```csharp
app.MapScalarApiReference(options =>
{
    // Fluent API
    options
        .WithPreferredScheme("ApiKey") // Name of the security scheme in the OpenAPI document
        .WithApiKeyAuthentication(apiKey =>
        {
            apiKey.Token = "your-api-key";
        });

    // Object initializer
    options.Authentication = new ScalarAuthenticationOptions
    {
        PreferredSecurityScheme = "ApiKey", // Name of the security scheme in the OpenAPI document
        ApiKey = new ApiKeyOptions
        {
            Token = "your-api-key"
        }
    }
});
```

#### OAuth

Similarly, OAuth fields like the client ID and scopes can be pre-filled.

```csharp
app.MapScalarApiReference(options =>
{
    options
        .WithPreferredScheme("OAuth2") // Name of the security scheme in the OpenAPI document
        .WithOAuth2Authentication(oauth =>
        {
            oauth.ClientId = "your-client-id";
            oauth.Scopes = ["profile"];
        });
});
```

### OpenAPI document

By default, Scalar uses the OpenAPI document located at `/openapi/{documentName}.json`, which aligns with the default route of Microsoft's built-in OpenAPI generator. If your OpenAPI document is located at a different path, such as with Swashbuckle or NSwag, you can specify the path using the `OpenApiRoutePattern` property:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithOpenApiRoutePattern("/swagger/{documentName}.json");
    // or
    options.OpenApiRoutePattern = "/swagger/{documentName}.json";
});
```

### API reference Route

The Scalar API reference is initially accessible at `/scalar/{documentName}`, but you can customize this route using the `EndpointPathPrefix` property:

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

By default, Scalar uses local assets to render the UI. If you prefer to load assets from a CDN, you can set the `CdnUrl` property to specify the CDN path.

```csharp
app.MapScalarApiReference(options =>
{
    options.WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference");
    // or
    options.CdnUrl = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
});
```

> [!NOTE]
> Fonts are loaded from a CDN by default. To disable this, set `DefaultFonts` to false.

### Dependency Injection

Configuration options can also be set via dependency injection:

```csharp
builder.Services.Configure<ScalarOptions>(options => options.Title = "My API");
// or
builder.Services.AddOptions<ScalarOptions>().BindConfiguration("Scalar");
```

> [!NOTE]
> Options set via the `MapScalarApiReference` method override those set through dependency injection.

### Additional information

The `MapScalarApiReference` method is implemented as a minimal API endpoint and returns an `IEndpointConventionBuilder`, allowing you to use minimal API features such as authorization:

```csharp
app
    .MapScalarApiReference()
    .RequireAuthorization();
```

For all available configuration properties and their default values, check out the [ScalarOptions](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/src/Scalar.AspNetCore/Options/ScalarOptions.cs) and the [`ScalarOptionsExtensions`](https://github.com/scalar/scalar/blob/main/packages/scalar.aspnetcore/src/Scalar.AspNetCore/Extensions/ScalarOptionsExtensions.cs).
