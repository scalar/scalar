# Scalar API Reference for .NET Aspire

The `Scalar.Aspire` package seamlessly integrates Scalar API Reference into your .NET Aspire applications, providing a unified documentation interface for all your services.

## Overview

Scalar for Aspire provides:

- **Unified API Documentation**: View documentation for all services in a single, cohesive interface
- **Simplified Service Discovery**: Automatically discover and configure API endpoints from your Aspire services
- **Multiple Document Support**: Each service can expose multiple OpenAPI specifications
- **CORS Issue Elimination**: Built-in proxy (enabled by default) handles API requests without requiring CORS configuration
- **HTTPS Support**: Complete support for both HTTP and HTTPS endpoints with automatic handling

## Prerequisites

The Scalar Aspire integration requires a container solution such as **Docker** or **Podman** to be installed on your machine.

### Service Requirements

Each service you want to include in the API Reference must:

- Expose OpenAPI documents over HTTP or HTTPS endpoints
- Implement the `IResourceWithServiceDiscovery` interface

## Quick Start

### 1. Install the Package

```shell
dotnet add package Scalar.Aspire
```

### 2. Basic Configuration

Add the integration to your AppHost:

```csharp
using Scalar.Aspire;

var builder = DistributedApplication.CreateBuilder(args);

// Add your services
var userService = builder.AddNpmApp("user-service", "../MyUserService");
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

### Service Configuration

Register services with custom configuration options:

```csharp
scalar.WithApiReference(bookService, options =>
{
    options
        .AddDocument("v1", "Book Management API")
        .WithOpenApiRoutePattern("/api-documentation/{documentName}.json")
        .WithTheme(ScalarTheme.Mars);
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

// Set a specific document as default
scalar.WithApiReference(bookService, options =>
{
    options
        .AddDocument("v1", "Book API v1")
        .AddDocument("v2", "Book API v2", isDefault: true)
        .AddDocument("beta", "Book API Beta", "/beta/{documentName}.json");
});
```

## HTTPS Support

Scalar supports HTTPS endpoints.

### Basic HTTPS Configuration

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options
        .PreferHttpsEndpoint() // Use HTTPS endpoints when available
        .AllowSelfSignedCertificates(); // Trust self-signed certificates
});
```

:::scalar-callout{ type=warning }
The `AllowSelfSignedCertificates()` method should only be used in development environments, never in production.
:::

### How HTTPS Support Works

- **Protocol Selection**: HTTP is used by default. Use `PreferHttpsEndpoint()` to prioritize HTTPS when available
- **Automatic Configuration**: When HTTPS is preferred, both OpenAPI document routes and server URLs are automatically configured to use HTTPS endpoints
- **Automatic Redirects**: HTTP to HTTPS redirects are handled automatically with proper header rewriting (localhost only)
- **Certificate Validation**: Self-signed certificates can be trusted in development using `AllowSelfSignedCertificates()`
- **Fallback Behavior**: If HTTPS is preferred but unavailable, HTTP endpoints are used as fallback. Conversely, if no HTTP endpoint is available, HTTPS endpoints are automatically used

:::scalar-callout{ type=info }
Currently, the Scalar API Reference interface is hosted over HTTP, even when communicating with HTTPS services. Support for hosting the Scalar interface under HTTPS will be added in a future release.
:::

## Proxy Configuration

Scalar for Aspire includes a built-in proxy that is **enabled by default** to provide seamless integration with your services.

### How the Proxy Works

When the proxy is enabled:

- **Eliminates CORS Issues**: All API requests are routed through the Scalar proxy, avoiding CORS restrictions
- **Service Discovery Integration**: OpenAPI servers and document routes are configured to use service discovery endpoints through the proxy
- **Default Endpoint**: The proxy is served at `/scalar-proxy`

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

:::scalar-callout{ type=info }
When the proxy is enabled, OAuth token requests are automatically proxied through the Scalar proxy to avoid CORS issues. However, interactive authorization requests are not proxied since they occur directly in the browser, so authorization URLs must be correctly configured and accessible. See the [Aspire playground on GitHub](https://github.com/scalar/scalar/blob/4d509fb6a074b7c779fad9ed17148a9c52db3eb9/integrations/aspire/playground/Scalar.Aspire.BookService/Program.cs#L15-L21).
:::

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

## Common Pitfalls

### YARP Integration Issues

When using YARP (`Aspire.Hosting.Yarp`), you may encounter proxy routing conflicts. Here are two solutions:

#### Solution 1: Configure Proxy URL for YARP Routes

Match the proxy URL to your YARP route pattern:

```csharp
var scalar = builder
    .AddScalarApiReference(options =>
    {
        options.WithProxyUrl("/api-documentation/scalar-proxy");
    });

builder
    .AddYarp("my-proxy")
    .WithConfiguration(yarp =>
    {
        yarp
            .AddRoute("/api-documentation/{**catch-all}", scalar)
            .WithTransformPathRemovePrefix("/api-documentation");
    });
```

#### Solution 2: Disable the Proxy

Alternatively, disable the proxy entirely, but you'll need to handle CORS configuration yourself:

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options.DisableDefaultProxy();
});
```

## Additional Resources

For more advanced configuration options see the [.NET ASP.NET Core documentation](https://guides.scalar.com/scalar/scalar-api-references/integrations/net-aspnet-core#configuration-options). Many configuration options are similar between `Scalar.AspNetCore` and `Scalar.Aspire` integrations.