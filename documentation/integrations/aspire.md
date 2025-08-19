# Scalar API Reference for .NET Aspire

The `Scalar.Aspire` package seamlessly integrates Scalar API Reference into your .NET Aspire applications, providing a unified documentation interface for all your microservices.

## Overview

With Scalar for Aspire, you can:

- **Unify API Documentation**: View documentation for all microservices in a single, cohesive interface
- **Simplify Service Discovery**: Automatically discover and configure API endpoints from your Aspire services
- **Support Multiple Documents**: Each service can expose multiple OpenAPI specifications
- **Eliminate CORS Issues**: Built-in proxy (enabled by default) handles API requests without requiring CORS configuration
- **Automatic Endpoint Configuration**: OpenAPI documents and servers are automatically configured to work with service discovery
- **Work with HTTPS**: Full support for both HTTP and HTTPS endpoints with automatic handling

## Prerequisites

:::scalar-callout{ type=info }
The Scalar Aspire integration requires a container solution such as **Docker** or **Podman** to be installed on your machine.
:::

### Service Requirements

Each service you want to include in the API Reference must:

- Expose OpenAPI documents over HTTP or HTTPS endpoints
- Implement the `IResourceWithServiceDiscovery` interface
- Define an endpoint named **"http"** or **"https"**

## Quick Start

### 1. Install the Package

```shell
dotnet add package Scalar.Aspire
```

### 2. Basic Configuration

Add the integration to your AppHost `Program.cs`:

```csharp
using Scalar.Aspire;

var builder = DistributedApplication.CreateBuilder(args);

// Add your services
var userService = builder
    .AddNpmApp("user-service", "../MyUserService")
    .WithHttpEndpoint(env: "PORT");

var bookService = builder.AddProject<Projects.BookService>("book-service");

// Add Scalar API Reference
var scalar = builder.AddScalarApiReference();

// Register services with the API Reference
scalar
    .WithApiReference(userService)
    .WithApiReference(bookService);

builder.Build().Run();
```

That's it! 🎉 The Aspire dashboard will display a Scalar API Reference resource with unified documentation for all your services.

## Configuration

### Global Configuration

Configure global settings that apply to all services:

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options.WithTheme(ScalarTheme.Purple);
});
```

### Service Registration

Register each service individually to include it in the API Reference:

```csharp
// Basic registration with default settings
scalar.WithApiReference(weatherService);

// Custom configuration for specific services
scalar.WithApiReference(bookService, options =>
{
    options
        .AddDocument("v1", "Book Management API")
        .WithOpenApiRoutePattern("/api-documentation/{documentName}.json")
        .WithTheme(ScalarTheme.Purple);
});
```

### Multiple OpenAPI Documents

Services can expose multiple OpenAPI specifications:

```csharp
scalar.WithApiReference(catalogService, options =>
{
    // Add individual documents with custom titles
    options
        .AddDocument("v1", "Catalog API v1")
        .AddDocument("v2", "Catalog API v2")
        .AddDocument("admin", "Admin API", routePattern: "/admin/{documentName}.json");
});

// Or add multiple documents at once
scalar.WithApiReference(userService, options =>
{
    options.AddDocuments("public", "internal", "admin");
});
```

## HTTPS Support

Scalar supports HTTPS endpoints.

### Basic HTTPS Configuration

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options
        .PreferHttps() // Use HTTPS endpoints when available
        .AllowSelfSignedCertificates(); // For development environments
});
```

:::scalar-callout{ type=warning }
The `AllowSelfSignedCertificates()` method should only be used in development environments, never in production.
:::

### How HTTPS Works

- **Protocol Selection**: HTTP is used by default. Use `PreferHttps()` to prioritize HTTPS when available
- **Automatic Redirects**: HTTP to HTTPS redirects are handled automatically with proper header rewriting (localhost only)
- **Certificate Validation**: Self-signed certificates can be trusted in development using `AllowSelfSignedCertificates()`
- **Fallback Behavior**: If HTTPS is preferred but unavailable, HTTP endpoints are used as fallback

:::scalar-callout{ type=info }
Currently, the Scalar API Reference interface is hosted over HTTP, even when communicating with HTTPS services. Support for hosting the Scalar interface under HTTPS will be added in a future release.
:::

## Proxy Configuration

Scalar for Aspire includes a built-in proxy that is **enabled by default** to provide seamless integration with your services.

### How the Proxy Works

When the proxy is enabled (default behavior):

- **Eliminates CORS Issues**: All API requests are routed through the Scalar proxy, avoiding CORS restrictions
- **Service Discovery Integration**: OpenAPI servers and document routes are configured to use service discovery endpoints through the proxy

### Disabling the Proxy

You can disable the default proxy if you prefer direct service communication:

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options.DisableDefaultProxy();
});
```

When the proxy is disabled:

- **Direct Service Communication**: OpenAPI documents and servers point directly to the actual service endpoints
- **CORS Configuration Required**: You'll need to configure CORS on your services to allow requests from the Scalar interface

## Authentication

Configure authentication globally or per service to secure your API documentation.

### Global Authentication

Apply authentication settings to all services:

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options
        .AddPreferredSecuritySchemes("OAuth2", "ApiKey")
        .AddAuthorizationCodeFlow("OAuth2", flow =>
        {
            flow
                .WithClientId("aspire-client")
                .WithAuthorizationUrl("https://auth.example.com/oauth2/authorize")
                .WithTokenUrl("https://auth.example.com/oauth2/token");
        })
        .AddApiKeyAuthentication("ApiKey", apiKey =>
        {
            apiKey.WithValue("your-development-api-key");
        });
});
```

### Service-Specific Authentication

Configure different authentication for individual services:

```csharp
scalar
    .WithApiReference(weatherService, options =>
    {
        options
            .AddPreferredSecuritySchemes("WeatherApiKey")
            .AddApiKeyAuthentication("WeatherApiKey", apiKey =>
            {
                apiKey.WithValue("weather-service-key");
            });
    })
    .WithApiReference(bookService, options =>
    {
        options
            .AddPreferredSecuritySchemes("BookOAuth")
            .AddAuthorizationCodeFlow("BookOAuth", flow =>
            {
                flow
                    .WithClientId("book-service-client")
                    .WithSelectedScopes("books:read", "books:write");
            });
    });
```

### Asynchronous Configuration

Use async configuration when you need to fetch secrets or perform other asynchronous operations:

```csharp
scalar.WithApiReference(bookService, async (options, cancellationToken) =>
{
    options
        .AddDocument("v1", "Book Management API")
        .WithOpenApiRoutePattern("/api-documentation/{documentName}.json");

    // Fetch API key from secure storage
    var apiKey = await secretProvider.GetValueAsync("BOOKS_API_KEY", cancellationToken);

    options
        .AddPreferredSecuritySchemes("BookApiKey")
        .AddApiKeyAuthentication("ApiKey", schema => schema.WithValue(apiKey));
});
```

## Additional Resources

For more advanced configuration options and detailed API reference, see the [.NET ASP.NET Core documentation](https://guides.scalar.com/scalar/scalar-api-references/integrations/net-aspnet-core#configuration-options). Most configuration options are shared between `Scalar.AspNetCore` and `Scalar.Aspire` integrations.