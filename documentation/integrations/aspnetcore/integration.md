# Scalar API Reference for .NET ASP.NET Core

The `Scalar.AspNetCore` NuGet package provides an easy way to render beautiful API References based on OpenAPI documents.

## Basic Setup

1. **Install the package**

```shell
dotnet add package Scalar.AspNetCore
```

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

For `Swashbuckle.AspNetCore.SwaggerGen`:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

if (app.Environment.IsDevelopment())
{
    app.MapSwagger("/openapi/{documentName}.json");
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

You're all set! 🎉 Navigate to `/scalar` to view your API Reference.

:::scalar-callout{ type=info }
For multiple OpenAPI documents, see [Multiple OpenAPI Documents](#configuration-options__multiple-openapi-documents).
:::

## Migration Guide

If you are upgrading from `2.1.x` to `2.2.x`, please refer to the [migration guide](https://github.com/scalar/scalar/discussions/5468).
If you are upgrading from `1.x.x` to `2.x.x`, please refer to the [migration guide](https://github.com/scalar/scalar/issues/4362).

## MapScalarApiReference Overloads

The `MapScalarApiReference` method provides several overloads to customize the route and configuration:

### Basic Usage

```csharp
// Accessible at /scalar (default route)
app.MapScalarApiReference();
```

### Custom Route

```csharp
app.MapScalarApiReference("/api-docs");
app.MapScalarApiReference("/docs");
```

### With Configuration

```csharp
app.MapScalarApiReference(options =>
{
    options.WithTitle("My API");
});
```

### Custom Route + Configuration

```csharp
app.MapScalarApiReference("/docs", options =>
{
    options.WithTitle("My API Documentation");
});
```

### Dynamic Configuration

```csharp
// Access HttpContext for dynamic configuration
app.MapScalarApiReference((options, httpContext) =>
{
    var isAdmin = httpContext.User.IsInRole("Admin");
    options.WithTitle(isAdmin ? "Admin API" : "Public API");
});

// Custom route with HttpContext access
app.MapScalarApiReference("/docs", (options, httpContext) =>
{
    options.WithTitle($"API for {httpContext.User.Identity?.Name}");
});
```

## Configuration Options

The `options` parameter provides a fluent API to customize Scalar:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithTitle("My API")
           .WithSidebar(false)
           .WithDarkMode(true)
           .WithDefaultOpenAllTags(true);
});
```

### OpenAPI Document Route

Customize where Scalar looks for your OpenAPI document:

```csharp
app.MapScalarApiReference(options =>
{
    // Custom local path
    options.WithOpenApiRoutePattern("/api-spec/{documentName}.json");
    
    // External URL
    options.WithOpenApiRoutePattern("https://api.example.com/openapi/{documentName}.json");
    
    // Static external URL (no placeholder)
    options.WithOpenApiRoutePattern("https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json");
});
```

### Multiple OpenAPI Documents

Scalar allows you to configure multiple OpenAPI documents using the `AddDocument` or `AddDocuments` methods. By default, the document name `v1` will be used. Each document can have its own custom route pattern for accessing the OpenAPI specification.

#### Add a Single Document

```csharp
// Simple document name (uses default route pattern)
app.MapScalarApiReference(options => options.AddDocument("v1"));

// With custom title
app.MapScalarApiReference(options => options.AddDocument("v1", "Production API"));

// With custom route pattern
app.MapScalarApiReference(options => options.AddDocument("v1",
    routePattern: "api-specs/{documentName}/openapi.json"));

// Complete configuration
app.MapScalarApiReference(options => options.AddDocument("v1",
    "Production API", "api-specs/v1/openapi.json"));

// External OpenAPI document
app.MapScalarApiReference(options => options.AddDocument("galaxy",
    "Galaxy API", "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json"));
```

#### Add Multiple Documents

```csharp
// Chain multiple documents
app.MapScalarApiReference(options =>
{
    options.AddDocument("v1", "Production API", "api/v1/openapi.json")
           .AddDocument("v2-beta", "Beta API", "api/v2-beta/openapi.json", isDefault: true)
           .AddDocument("internal", "Internal API", "internal/openapi.json");
});

// From string array
string[] versions = ["v1", "v2", "v3"];
app.MapScalarApiReference(options => options.AddDocuments(versions));

// From ScalarDocument objects
var documents = new[]
{
    new ScalarDocument("v1", "Production API", "api/v1/openapi.json"),
    new ScalarDocument("v2-beta", "Beta API", "api/v2-beta/openapi.json", true),
    new ScalarDocument("galaxy", "Galaxy API", "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json")
};
app.MapScalarApiReference(options => options.AddDocuments(documents));
```

The `routePattern` parameter in `AddDocument` allows you to customize the URL path where the OpenAPI document is served. If not specified, it uses the global `OpenApiRoutePattern` from the options. The pattern can include the `{documentName}` placeholder which will be replaced with the document name.

The `isDefault` parameter allows you to specify which document should be selected by default when the API Reference loads. If no document is marked as default, the first document in the list will be used.

### Authentication

Scalar allows you to pre-configure authentication details for your API, making it easier for developers to test your endpoints. Scalar supports API Key, OAuth2, and HTTP authentication schemes.


:::scalar-callout{ type=warning }
**Before you start**: Your OpenAPI document must already include authentication security schemes for Scalar to work with them. Scalar can only pre-fill authentication details for schemes that are already defined in your OpenAPI specification.

The security schemes are added by your OpenAPI generator (`NSwag`, `Swashbuckle.AspNetCore.SwaggerGen`, or `Microsoft.AspNetCore.OpenApi`). If you don't see authentication options in Scalar, check your OpenAPI generator's documentation to learn how to properly define security schemes.
:::

:::scalar-callout{ type=danger }
**Security Notice**: Pre-filled authentication details are visible in the browser and should **never** be used in production environments. Only use this feature for development and testing.
:::


#### API Key Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("ApiKey")
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "sk-demo-key-12345";
    }));
```

#### Bearer Token Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("BearerAuth")
    .AddHttpAuthentication("BearerAuth", auth =>
    {
        auth.Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
    }));
```

#### Basic Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("BasicAuth")
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "demo-user";
        auth.Password = "demo-password";
    }));
```

#### OAuth2 Authentication

Scalar provides convenience methods for each OAuth2 flow type to pre-fill authentication details in the API reference interface:

##### Authorization Code Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "scalar-demo-client";
        flow.ClientSecret = "scalar-demo-secret";
        flow.Pkce = Pkce.Sha256;
        flow.SelectedScopes = ["read", "write", "admin"];
    }));
```

##### Client Credentials Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddClientCredentialsFlow("OAuth2", flow =>
    {
        flow.ClientId = "service-client-12345";
        flow.ClientSecret = "service-secret-67890";
        flow.SelectedScopes = ["api.read", "api.write"];
    }));
```

##### Password Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddPasswordFlow("OAuth2", flow =>
    {
        flow.ClientId = "password-client";
        flow.Username = "demo@example.com";
        flow.Password = "demo-password-123";
        flow.SelectedScopes = ["profile", "email"];
    }));
```

##### Implicit Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddImplicitFlow("OAuth2", flow =>
    {
        flow.ClientId = "spa-client-abc123";
        flow.SelectedScopes = ["openid", "profile", "email"];
    }));
```

##### Advanced OAuth2 Configuration

```csharp
app.MapScalarApiReference(options => options
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "advanced-client-id";
        
        // Custom query parameters for authorization request
        flow.AddQueryParameter("audience", "https://api.example.com")
            .AddQueryParameter("resource", "https://graph.microsoft.com");

        // Custom body parameters for token request
        flow.AddBodyParameter("custom_param", "custom_value");

        // Specify credentials location
        flow.WithCredentialsLocation(CredentialsLocation.Header);
    }));
```

##### Multiple OAuth2 Flows

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddOAuth2Flows("OAuth2", flows =>
    {
        flows.AuthorizationCode = new AuthorizationCodeFlow
        {
            ClientId = "web-client-12345",
            AuthorizationUrl = "https://auth.example.com/oauth2/authorize",
            TokenUrl = "https://auth.example.com/oauth2/token"
        };

        flows.ClientCredentials = new ClientCredentialsFlow
        {
            ClientId = "service-client-67890",
            ClientSecret = "service-secret",
            TokenUrl = "https://auth.example.com/oauth2/token"
        };
    })
    .AddDefaultScopes("OAuth2", ["read", "write"]));
```

#### Multiple Security Schemes

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2", "ApiKey")
    
    // Configure OAuth2
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "multi-auth-client";
        flow.SelectedScopes = ["read", "write"];
    })
    
    // Configure API Key
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "sk-demo-key-12345";
    })
    
    // Configure Basic Auth
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "demo-user";
        auth.Password = "demo-password";
    }));
```

#### Persisting Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "persistent-client-id";
    })
    .WithPersistentAuthentication());
```

:::scalar-callout{ type=danger }
Persisting authentication information in the browser's local storage may present security risks. Use with caution.
:::

### Custom HTTP Client

Set a default HTTP client for code samples:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});
```

### Assets

Scalar uses local assets by default. To load assets from a different location:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference");
});
```

:::scalar-callout{ type=info }
Fonts are loaded from a CDN by default. To disable this, set `DefaultFonts` to `false`.
:::

### Custom JavaScript Configuration

Extend Scalar's functionality with a custom JavaScript configuration module:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithJavaScriptConfiguration("/scalar/config.js");
});
```

Create a JavaScript module in your static files directory (e.g. `wwwroot/scalar/config.js`) that exports a default object with your custom configuration:

```javascript
// wwwroot/scalar/config.js
export default {
  // Custom slug generation for operations
  generateOperationSlug: (operation) => `custom-${operation.method.toLowerCase()}${operation.path}`,

  // Hook into document selection events
  onDocumentSelect: () => console.log('Document changed'),

  // Add any other custom configuration options supported by Scalar
  // Checkout https://guides.scalar.com/scalar/scalar-api-references/configuration
}
```

:::scalar-callout{ type=info }
Make sure to expose the directory that contains your JavaScript module through static file middleware using `app.MapStaticAssets()` or `app.UseStaticFiles()`.
:::

### Dependency Injection

Configuration options can also be set via dependency injection:

```csharp
builder.Services.Configure<ScalarOptions>(options => options.Title = "My API");
// or
builder.Services.AddOptions<ScalarOptions>().BindConfiguration("Scalar");
```

:::scalar-callout{ type=info }
Options set via `MapScalarApiReference` override those set through dependency injection.
:::

## Additional Information

The `MapScalarApiReference` method returns an `IEndpointConventionBuilder`, allowing you to use minimal API features:

```csharp
app.MapScalarApiReference().AllowAnonymous();
```

Scalar for ASP.NET Core aligns with the [official Microsoft .NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core).

For all available configuration properties and their default values, check out the [`ScalarOptions`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Options/ScalarOptions.cs) and [`ScalarOptionsExtensions`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Extensions/ScalarOptionsExtensions.cs).
