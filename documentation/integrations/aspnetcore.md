# Scalar API Reference for .NET ASP.NET Core

The `Scalar.AspNetCore` NuGet package provides an easy way to render beautiful API References based on OpenAPI/Swagger documents.

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

For `Swashbuckle.AspNetCore`:

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

You're all set! 🎉

By default, navigating to `/scalar` in your browser will display the API Reference for the `v1` OpenAPI document.

To display a different document, simply add it using `AddDocument` or `AddDocuments` (see [Multiple OpenAPI Documents](#multiple-openapi-documents)). You can also access a specific document directly by visiting `/scalar/{documentName}` (for example, `/scalar/v2-beta`).

## Migration Guide

If you are upgrading from `2.1.x` to `2.2.x`, please refer to the [migration guide](https://github.com/scalar/scalar/discussions/5468).
If you are upgrading from `1.x.x` to `2.x.x`, please refer to the [migration guide](https://github.com/scalar/scalar/issues/4362).

## Configuration Options

The `MapScalarApiReference` method accepts an optional `options` parameter, which you can use to customize Scalar using the fluent API or object initializer syntax. This parameter can be of type `Action<ScalarOptions>` or `Action<ScalarOptions, HttpContext>`.

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

// Or with HttpContext
app.MapScalarApiReference((options, httpContext) =>
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

### API Reference Route

The Scalar API Reference is initially accessible at `/scalar`. You can customize this route using the `endpointPrefix` parameter:

```csharp
app.MapScalarApiReference("/api-reference");
```

### OpenAPI Document Route

Scalar expects the OpenAPI document to be available at `/openapi/{documentName}.json`, which aligns with the default route used by the `Microsoft.AspNetCore.OpenApi` package. If your OpenAPI document is hosted at a different path (such as when using `Swashbuckle.AspNetCore` or `NSwag`), you can specify the correct path or URL using the `OpenApiRoutePattern` property:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithOpenApiRoutePattern("/swagger/{documentName}.json");
    // or
    options.OpenApiRoutePattern = "/swagger/{documentName}.json";
    // Can also point to an external URL:
    options.OpenApiRoutePattern = "https://example.com/swagger/{documentName}.json";
});
```

### Multiple OpenAPI Documents

Scalar allows you to configure multiple OpenAPI documents using the `AddDocument` or `AddDocuments` methods. By default, the document name `v1` will be used. Each document can have its own custom route pattern for accessing the OpenAPI specification.

#### Add a Single Document

```csharp
// Basic usage with default route pattern /openapi/{documentName}.json.
//Only document name is required
app.MapScalarApiReference(options => options.AddDocument("v1"));

// Optional title parameter
app.MapScalarApiReference(options => options.AddDocument("v1", "Production API"));

// Skip title but specify routePattern
app.MapScalarApiReference(options => options.AddDocument("v1",
  routePattern: "api-specs/{documentName}/openapi.json"));

// All parameters specified
app.MapScalarApiReference(options => options.AddDocument("v1",
  "Production API", "api-specs/v1/openapi.json"));

// Using external URL without title
app.MapScalarApiReference(options => options.AddDocument("external",
  routePattern: "https://api.example.com/v1/openapi.json"));
```

#### Add Multiple Documents

```csharp
// Using AddDocument with different route patterns
app.MapScalarApiReference(options =>
{
    options
        .AddDocument("v1", "Production API", "api/{documentName}/spec.json")
        .AddDocument("v2-beta", "Beta API", "beta/openapi.json");
});

// Using AddDocuments with string array (uses default route pattern)
string[] versions = ["v1", "v2"];
app.MapScalarApiReference(options => options.AddDocuments(versions));

// Using AddDocuments with ScalarDocument objects
var documents = new[]
{
    new ScalarDocument("v1", "Production API", "api/v1/spec.json"),
    new ScalarDocument("v2-beta", "Beta API", "beta/openapi.json"),
    new ScalarDocument("v3-dev", "Development API", "dev/{documentName}.json")
};
app.MapScalarApiReference(options => options.AddDocuments(documents));
```

The `routePattern` parameter in `AddDocument` allows you to customize the URL path where the OpenAPI document is served. If not specified, it uses the global `OpenApiRoutePattern` from the options. The pattern can include the `{documentName}` placeholder which will be replaced with the document name.

### Authentication

Scalar allows you to pre-configure authentication details for your API, making it easier for developers to test your endpoints. Scalar supports API Key, OAuth2, and HTTP authentication schemes.


:::scalar-callout{ type=warning }
**Before you start**: Your OpenAPI document must already include authentication security schemes for Scalar to work with them. Scalar can only pre-fill authentication details for schemes that are already defined in your OpenAPI specification.

The security schemes are added by your OpenAPI generator (`NSwag`, `Swashbuckle.AspNetCore`, or `Microsoft.AspNetCore.OpenApi`). If you don't see authentication options in Scalar, check your OpenAPI generator's documentation to learn how to properly define security schemes.
:::

:::scalar-callout{ type=danger }
**Security Notice**: Pre-filled authentication details are visible in the browser and should **never** be used in production environments. Only use this feature for development and testing.
:::


#### API Key Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("ApiKey") // Make this the default auth method
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "your-api-key-here";
    })
);
```

#### Bearer Token Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("BearerAuth")
    .AddHttpAuthentication("BearerAuth", auth =>
    {
        auth.Token = "eyJhbGciOiJ...";
    })
);
```

#### Basic Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("BasicAuth")
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "demo-user";
        auth.Password = "demo-password";
    })
);
```

#### OAuth2 Authentication

Scalar provides convenience methods for each OAuth2 flow type to pre-fill authentication details in the API reference interface:

##### Authorization Code Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.ClientSecret = "your-client-secret";
        flow.Pkce = Pkce.Sha256; // Enable PKCE
        flow.SelectedScopes = ["read", "write"]; // Pre-select scopes
    })
);
```

##### Client Credentials Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddClientCredentialsFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-service-client-id";
        flow.ClientSecret = "your-service-client-secret";
        flow.SelectedScopes = ["read", "write"]; // Pre-select scopes
    })
);
```

##### Password Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddPasswordFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.Username = "demo-user"; // Pre-fill username
        flow.Password = "demo-password"; // Pre-fill password
    })
);
```

##### Implicit Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddImplicitFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-spa-client-id";
        flow.SelectedScopes = ["openid", "profile"]; // Pre-select scopes
    })
);
```

##### Adding Custom OAuth Parameters

Many OAuth providers require additional parameters:

```csharp
app.MapScalarApiReference(options => options
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        // Add provider-specific parameters
        flow
            .AddQueryParameter("audience", "https://api.example.com")
            .AddQueryParameter("resource", "https://graph.microsoft.com");

        // Alternatively, set query parameters using the property
        flow.AdditionalQueryParameters = new Dictionary<string, string>
        {
            ["audience"] = "https://api.example.com",
            ["resource"] = "https://graph.microsoft.com"
        };
    })
);
```

##### Multiple OAuth2 Flows

Configure multiple flows for the same OAuth2 scheme:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddOAuth2Flows("OAuth2", flows =>
    {
        flows.AuthorizationCode = new AuthorizationCodeFlow
        {
            ClientId = "web-client-id",
            AuthorizationUrl = "https://auth.example.com/oauth2/authorize",
            TokenUrl = "https://auth.example.com/oauth2/token"
        };

        flows.ClientCredentials = new ClientCredentialsFlow
        {
            ClientId = "service-client-id",
            ClientSecret = "service-client-secret",
            TokenUrl = "https://auth.example.com/oauth2/token"
        };
    })
    .AddDefaultScopes("OAuth2", ["read", "write"]) // Apply to all flows
);
```

##### Manual OAuth2 Configuration

For complete control over the OAuth2 configuration:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddOAuth2Authentication("OAuth2", scheme =>
    {
        scheme.Flows = new ScalarFlows
        {
            AuthorizationCode = new AuthorizationCodeFlow
            {
                ClientId = "your-client-id",
                RedirectUri = "https://your-app.com/callback"
            }
        };
        scheme.DefaultScopes = ["profile", "email"];
    })
);
```

#### Multiple Security Schemes

You can configure multiple security schemes at once:

```csharp
app.MapScalarApiReference(options => options
    // Set multiple preferred schemes
    .AddPreferredSecuritySchemes("OAuth2", "ApiKey", "BasicAuth")

    // Configure OAuth2
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.SelectedScopes = ["read", "write"];
    })

    // Configure API Key
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "your-api-key";
    })

    // Configure HTTP Basic
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "demo-user";
        auth.Password = "demo-password";
    })
);
```

#### Fluent API Configuration

All authentication configuration shown above can also be configured using the fluent API syntax. Here is an example of how to set up multiple authentication schemes using the fluent API:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2", "ApiKey")
    .AddOAuth2Authentication("OAuth2", scheme => scheme
        .WithFlows(flows => flows
            .WithAuthorizationCode(flow => flow
                .WithAuthorizationUrl("https://example.com/oauth2/authorize")
                .WithTokenUrl("https://example.com/oauth2/token")
                .WithRefreshUrl("https://example.com/oauth2/refresh")
                .WithClientId("web-client-id"))
            .WithClientCredentials(flow => flow
                .WithTokenUrl("https://example.com/oauth2/token")
                .WithClientId("service-client-id")
                .WithClientSecret("service-secret")
                .WithSelectedScopes("read", "write")))
        .WithDefaultScopes("profile", "email"))
    .AddApiKeyAuthentication("ApiKey", scheme => scheme.WithValue("my-api-key"))
);
```

#### Persisting Authentication

By default, authentication information is lost when the page is refreshed. To persist authentication data in the browser's local storage, use the `WithPersistentAuthentication()` method or the `PersistentAuthentication` property:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
    })
    .WithPersistentAuthentication() // Enable persistence
);
```

With this configuration, users won't need to re-enter their authentication credentials after refreshing the page.

:::scalar-callout{ type=danger }
Persisting authentication information in the browser's local storage may present security risks in certain environments. Use this feature with caution based on your security requirements.
:::

### Custom HTTP Client

Scalar allows you to set a default HTTP client for code samples. The [`ScalarTarget`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Enums/ScalarTarget.cs) enum specifies the language, and the [`ScalarClient`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Enums/ScalarClient.cs) enum specifies the client type.

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

:::scalar-callout{ type=info }
Fonts are loaded from a CDN by default. To disable this, set `DefaultFonts` to `false`.
:::

### Custom JavaScript Configuration

Scalar allows you to extend its functionality by using a custom JavaScript configuration module. This is useful for customizing behavior that's not accessible through the C# configuration options.

To use this feature, specify the path to your JavaScript module using the `JavaScriptConfiguration` property:

```csharp
app.MapScalarApiReference(options =>
{
    options.WithJavaScriptConfiguration("/scalar/config.js");
    // or
    options.JavaScriptConfiguration = "/scalar/config.js";
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
  // Checkout https://github.com/scalar/scalar/blob/main/documentation/configuration.md)
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
Options set via the `MapScalarApiReference` method override those set through dependency injection.
:::

## Additional information

The `MapScalarApiReference` method is implemented as a minimal API endpoint and returns an `IEndpointConventionBuilder`, allowing you to use minimal API features such as authorization:

```csharp
app
  .MapScalarApiReference()
  .AllowAnonymous();
```

For all available configuration properties and their default values, check out the [`ScalarOptions`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Options/ScalarOptions.cs) and the [`ScalarOptionsExtensions`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Extensions/ScalarOptionsExtensions.cs).

## Scalar OpenAPI Extensions

The `Scalar.AspNetCore` package includes extension methods and attributes to enhance your OpenAPI documents with additional metadata. However, to make these extensions functional, you **must install** one of the companion packages (`Scalar.AspNetCore.Microsoft` or `Scalar.AspNetCore.Swashbuckle`) and register the appropriate transformers or filters in your application.

### Installation and Configuration

#### For `Microsoft.AspNetCore.OpenApi`

```shell
dotnet add package Scalar.AspNetCore.Microsoft
```

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Register Microsoft OpenAPI and configure it to use Scalar transformers
builder.Services.AddOpenApi(options =>
{
    options.AddScalarTransformers(); // Required for extensions to work
});

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference();
```

#### For `Swashbuckle.AspNetCore`

```shell
dotnet add package Scalar.AspNetCore.Swashbuckle
```

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddScalarFilters(); // Required for extensions to work
});

var app = builder.Build();

app.MapSwagger("/openapi/{documentName}.json");
app.MapScalarApiReference();
```

### Available Extensions

#### API Stability

Indicates the stability status of an API endpoint:

- `Stability.Stable`: Production-ready API
- `Stability.Experimental`: API likely to change, not recommended for production
- `Stability.Deprecated`: API will be removed in a future release

```csharp
// Extension methods
app.MapGet("/products", GetProducts).Stable();
app.MapGet("/beta-features", GetBetaFeatures).Experimental();
app.MapGet("/legacy-endpoint", GetLegacyData).Deprecated();

// Attribute
[Stability(Stability.Experimental)]
public IActionResult CreateProduct() { }
```

#### Exclude From API Reference

Prevents an endpoint from appearing in the Scalar API Reference while keeping it in the OpenAPI document.

:::scalar-callout{ type=info }
This only affects display in the Scalar API Reference. Endpoints remain in the OpenAPI document and are accessible via the API.
:::

```csharp
// Extension method
app.MapGet("/internal/metrics", GetMetrics).ExcludeFromApiReference();

// Attribute
[ExcludeFromApiReference]
public IActionResult GetInternalMetrics() { }
```

#### Code Samples

Adds code samples to API endpoints in various programming languages.

```csharp
// Extension methods
app.MapPost("/orders", CreateOrder)
    .CodeSample("fetch('/orders', { method: 'POST' })", ScalarTarget.JavaScript, "Create Order")
    .CodeSample("curl -X POST /orders", ScalarTarget.Shell, "Create Order with cURL")

// Attribute
[CodeSample("fetch('/products').then(r => r.json())", ScalarTarget.JavaScript)]
public IActionResult GetProducts() { }
```

### Usage Examples

#### Minimal APIs

```csharp
using Scalar.AspNetCore;

// Using extension methods
app.MapGet("/products", GetProducts)
    .Stable()
    .CodeSample("fetch('/products').then(r => r.json())", ScalarTarget.JavaScript);

app.MapGet("/internal/health", GetHealth)
    .ExcludeFromApiReference();

// Using attributes with delegate handlers
app.MapPost("/orders", [Stability(Stability.Experimental)]
    (CreateOrderRequest request) => { /* Implementation */ });
```

#### Controller APIs

```csharp
using Scalar.AspNetCore;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [Stability(Stability.Stable)]
    [CodeSample("GET /api/products", ScalarTarget.Shell)]
    public IActionResult GetProducts() { }

    [HttpPost]
    [Stability(Stability.Experimental)]
    [ExcludeFromApiReference]
    public IActionResult CreateProduct() { }
}
```

## Legacy .NET Integration

This guide explains how to integrate Scalar API Reference into .NET Framework and .NET Core projects using static assets.

### Prerequisites

- An ASP.NET or ASP.NET Core application with OpenAPI/Swagger support (using `Swashbuckle.AspNetCore` or `NSwag`)


### Step 1: Enable Swagger/OpenAPI in your project

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers();

    // Using Swashbuckle
    services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
    });

    // OR using NSwag
    services.AddOpenApiDocument();
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // Enable the endpoint for generating the OpenAPI documents
    app.UseSwagger();

    // Required for serving static scalar files
    app.UseStaticFiles();

    // Other middleware
    app.UseRouting();
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```

### Step 2: Create the directory structure

Create the following folder structure:

```
wwwroot/ (or your static files directory)
└── scalar/
    ├── index.html
    └── scalar.config.js
```

### Step 3: Create the HTML file for Scalar

Create `index.html` in the `wwwroot/scalar` directory with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scalar API Reference</title>
</head>
<body>
    <div id="app"></div>

    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script src="./scalar.config.js"></script>
</body>
</html>
```

### Step 4: Create the configuration file

Create `scalar.config.js` in the same directory:

```javascript
Scalar.initialize({
    selector: "#app",
    url: "/swagger/v1/swagger.json", // Adjust this URL to match your OpenAPI document path
    theme: "moon" // Other configuration
});
```

### Step 5: Accessing your API Reference

After starting your application, the Scalar API Reference will be available at:

```
http://localhost:<port>/scalar/index.html
```

#### Using a specific Scalar version

To use a specific version instead of the latest, specify the version in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.28.23"></script>
```

### Troubleshooting

- **Swagger JSON not loading**: Verify the URL path to your Swagger JSON in the configuration
- **CORS issues**: Ensure your API allows CORS if hosted on a different domain
- **Static files not serving**: Check that `app.UseStaticFiles()` is present in your middleware pipeline
- **404 errors**: Confirm the directory structure and that the files are correctly named

For more configuration options, refer to the [official Scalar configuration documentation](https://github.com/scalar/scalar/blob/main/documentation/configuration.md).
