# .NET Integration

The `Scalar.AspNetCore` package provides a simple way to integrate the Scalar API reference into your .NET 8+ application.

## Migration Guide

If you are upgrading from `2.1.x` to `2.2.x`, please refer to the [migration guide](https://github.com/scalar/scalar/discussions/5468).
If you are upgrading from `1.x.x` to `2.x.x`, please refer to the [migration guide](https://github.com/scalar/scalar/issues/4362).

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

You’re all set! 🎉 Visit `/scalar` to see the API Reference for the default OpenAPI document (`v1`).

If you have multiple OpenAPI documents, you can set them up with `AddDocument` or `AddDocuments` (see [Multiple OpenAPI Documents](#multiple-openapi-documents)).  
To view a specific document, go to `/scalar/{documentName}` (like `/scalar/v1` or `/scalar/v2-beta`).

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

Scalar expects the OpenAPI document to be available at `/openapi/{documentName}.json`, which aligns with the default route used by the `Microsoft.AspNetCore.OpenApi` package. If your OpenAPI document is hosted at a different path (such as when using `Swashbuckle` or `NSwag`), you can specify the correct path or URL using the `OpenApiRoutePattern` property:

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
// Basic usage with default route pattern /openapi/{documentName}.json. Only document name is required
app.MapScalarApiReference(options => options.AddDocument("v1"));

// Optional title parameter
app.MapScalarApiReference(options => options.AddDocument("v1", "Production API"));

// Skip title but specify routePattern
app.MapScalarApiReference(options => options.AddDocument("v1", routePattern: "api-specs/{documentName}/openapi.json"));

// All parameters specified
app.MapScalarApiReference(options => options.AddDocument("v1", "Production API", "api-specs/v1/openapi.json"));

// Using external URL without title
app.MapScalarApiReference(options => options.AddDocument("external", routePattern: "https://api.example.com/v1/openapi.json"));
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

Scalar supports various authentication schemes, including API Key, OAuth2 (with multiple flows), and HTTP Basic/Bearer, by allowing you to pre-fill certain authentication details.

These details can only be prefilled if the security schemes are defined in the OpenAPI document. Make sure your OpenAPI document includes the necessary security schemes for authentication to work correctly. The scheme is added by the OpenAPI generator, and the implementation may vary depending on the generator used (`NSwag`, `Swashbuckle`, or `Microsoft.AspNetCore.OpenApi`). For more information, please refer to the documentation of the respective generator.

> [!WARNING]
> Sensitive Information: Pre-filled authentication details are exposed to the client/browser and may pose a security risk. Do not use this feature in production environments.

#### API Key Authentication

To configure API key authentication:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("ApiKey") // Optional: Sets the default security scheme
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "your-api-key";
    })
);
```

#### OAuth2 Authentication

Scalar supports various OAuth2 flows through specific helper methods, but all of these methods are built on top of a core configuration method called `AddOAuth2Authentication`. This method gives you direct control over the OAuth2 security scheme configuration:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddOAuth2Authentication("OAuth2", scheme => 
    {
        // Configure flows manually
        scheme.Flows = new ScalarFlows
        {
            AuthorizationCode = new AuthorizationCodeFlow
            {
                ClientId = "your-client-id",
                RedirectUri = "https://your-app.com/callback"
            },
            ClientCredentials = new ClientCredentialsFlow
            {
                ClientId = "your-client-id",
                ClientSecret = "your-client-secret"
            }
        };
        
        // Set default scopes
        scheme.DefaultScopes = ["profile", "email"];
    })
);
```

> [!NOTE]
> All the OAuth2 convenience methods (`AddClientCredentialsFlow`, `AddAuthorizationCodeFlow`, 
> `AddImplicitFlow`, `AddPasswordFlow`, and `AddOAuth2Flows`) are wrappers around this core 
> `AddOAuth2Authentication` method. These convenience methods make it easier to configure specific 
> flows without having to set up the entire structure manually.

##### Authorization Code Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.ClientSecret = "your-client-secret";
        flow.Pkce = Pkce.Sha256;
        flow.SelectedScopes = ["profile", "email"];
    });
);
```

##### Client Credentials Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddClientCredentialsFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.ClientSecret = "your-client-secret";
    });
);
```

##### Implicit Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddImplicitFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
    });
);
```

##### Password Flow

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddPasswordFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
        flow.Username = "default-username"; // Pre-filled username
        flow.Password = "default-password"; // Pre-filled password
    });
);
```

##### Multiple OAuth2 Flows

You can configure multiple OAuth2 flows for a single security scheme:

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("OAuth2")
    .AddOAuth2Flows("OAuth2", flows =>
    {
        // Authorization Code flow
        flows.AuthorizationCode = new AuthorizationCodeFlow
        {
            ClientId = "your-client-id",
            AuthorizationUrl = "https://auth.example.com/oauth2/authorize",
            TokenUrl = "https://auth.example.com/oauth2/token",
            RedirectUri = "https://your-app.com/callback"
        };
        
        // Client Credentials flow
        flows.ClientCredentials = new ClientCredentialsFlow
        {
            ClientId = "your-client-id",
            ClientSecret = "your-client-secret",
            TokenUrl = "https://auth.example.com/oauth2/token"
        };
    })
    // All OAuth flows will have preselected scopes
    .AddDefaultScopes("OAuth2", ["profile", "email"])
);
```

#### HTTP Authentication

##### Bearer Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("BearerAuth")
    .AddHttpAuthentication("BearerAuth", auth =>
    {
        auth.Token = "ey...";
    });
);
```

##### Basic Authentication

```csharp
app.MapScalarApiReference(options => options
    .AddPreferredSecuritySchemes("BasicAuth")
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "your-username";
        auth.Password = "your-password";
    })
);
```

#### Multiple Security Schemes

You can configure multiple security schemes at once:

```csharp
app.MapScalarApiReference(options => options
    // Set the preferred (default) schemes - you can specify multiple preferred schemes
    .AddPreferredSecuritySchemes("OAuth2", "ApiKey")
    
    // Configure OAuth2
    .AddAuthorizationCodeFlow("OAuth2", flow =>
    {
        flow.ClientId = "your-client-id";
    })
    
    // Configure API Key
    .AddApiKeyAuthentication("ApiKey", apiKey =>
    {
        apiKey.Value = "your-api-key";
    })
    
    // Configure HTTP Basic
    .AddHttpAuthentication("BasicAuth", auth =>
    {
        auth.Username = "your-username";
        auth.Password = "your-password";
    });
);
```

> [!NOTE]
> For more detailed information about authentication, including how to configure security schemes in your OpenAPI document, refer to the [authentication documentation](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/docs/authentication.md).

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

> [!NOTE]
> Fonts are loaded from a CDN by default. To disable this, set `DefaultFonts` to `false`.

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

> [!NOTE]
> Make sure to expose the directory that contains your JavaScript module through static file middleware using `app.MapStaticAssets()` or `app.UseStaticFiles()`.

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
  .AllowAnonymous();
```

For all available configuration properties and their default values, check out the [`ScalarOptions`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Options/ScalarOptions.cs) and the [`ScalarOptionsExtensions`](https://github.com/scalar/scalar/blob/main/integrations/aspnetcore/src/Scalar.AspNetCore/Extensions/ScalarOptionsExtensions.cs).

## Scalar OpenAPI Extensions

Scalar provides extension methods to enhance OpenAPI documents with additional metadata through two specialized packages: `Scalar.AspNetCore.Microsoft` and `Scalar.AspNetCore.Swashbuckle`. These extensions allow you to add Scalar-specific information to your API endpoints.

> [!IMPORTANT]
> While the extension methods and attributes are available in the `Scalar.AspNetCore` package, they **will not work** unless you register the corresponding filters or transformers as shown in the [Configuration](#configuration) section below.

### Installation

#### For `Microsoft.AspNetCore.OpenApi`

```shell
dotnet add package Scalar.AspNetCore.Microsoft
```

#### For `Swashbuckle`

```shell
dotnet add package Scalar.AspNetCore.Swashbuckle
```

### Usage

#### Extension Methods for Minimal APIs

These extension methods can be used directly with your endpoint definitions in Minimal APIs:

```csharp
using Scalar.AspNetCore;

var app = builder.Build();

// Basic usage
app.MapGet("/products", GetProducts)
    .Experimental()  // Mark as experimental
    .ExcludeFromApiReference();

// More advanced example
app.MapPost("/orders", CreateOrder)
    .Stable();  // Mark as stable
```

#### Attributes for Controllers and Minimal APIs

You can also use attributes with both controller-based APIs and Minimal APIs:

```csharp
using Scalar.AspNetCore;

// For controller methods
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    [Stability(Stability.Stable)]
    public IActionResult GetProducts() 
    {
        // Implementation
    }
    
    [HttpPost]
    [Stability(Stability.Experimental)]
    [ExcludeFromApiReference]
    public IActionResult CreateProduct() 
    {
        // Implementation
    }
}

// For Minimal APIs with delegate handlers
app.MapGet("/products", [Stability(Stability.Stable)] 
    (string? filter) => 
    {
        // Implementation
    });
```

### Available Extensions

#### API Stability

Indicates the stability status of an API endpoint.

```csharp
// Extension methods
app.MapGet("/products", GetProducts).Stable();
app.MapGet("/beta-features", GetBetaFeatures).Experimental();
app.MapGet("/legacy-endpoint", GetLegacyData).Deprecated();

// Attribute
[Stability(Stability.Experimental)]
```

Available stability levels:
- `Stability.Stable`: Production-ready API
- `Stability.Experimental`: API likely to change, not recommended for production
- `Stability.Deprecated`: API will be removed in a future release

#### Exclude From API Reference

Prevents an endpoint from appearing in the Scalar API Reference while keeping it in the OpenAPI document.

> [!NOTE]
> The `ExcludeFromApiReference` extension/attribute only affects how endpoints are displayed in the Scalar API Reference. The endpoints are still included in the generated OpenAPI document and accessible via the API.

```csharp
// Extension method
app.MapGet("/internal/metrics", GetMetrics).ExcludeFromApiReference();

// Attribute
[ExcludeFromApiReference]
```

### Configuration

> [!IMPORTANT]
> For the extensions to work properly, you **must register** the appropriate filters (Swashbuckle) or transformers (Microsoft OpenAPI) as shown below.

#### Microsoft OpenAPI Integration

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Register Microsoft OpenAPI and configure it to use Scalar transformers
builder.Services.AddOpenApi(options =>
{
    // Register Scalar transformers
    options.AddScalarTransformers();
});

var app = builder.Build();

// Map OpenAPI endpoint
app.MapOpenApi();

// Map Scalar API Reference
app.MapScalarApiReference();
```

#### Swashbuckle Integration

```csharp
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();

// Register Swashbuckle with Scalar filters
builder.Services.AddSwaggerGen(options =>
{
    // Register Scalar filters
    options.AddScalarFilters();
});

var app = builder.Build();

app.MapSwagger("/openapi/{documentName}.json");
app.MapScalarApiReference();
```

## Legacy .NET Integration

This guide explains how to integrate Scalar API Reference into .NET Framework and .NET Core projects using static assets.

### Prerequisites

- An ASP.NET or ASP.NET Core application with OpenAPI/Swagger support (using Swashbuckle or NSwag)


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
