# Scalar API Reference for .NET Aspire

The `Scalar.Aspire` package provides a simple way to integrate the Scalar API Reference into your .NET Aspire applications, creating a unified API Reference for all your services.

## Basic Setup

:::scalar-callout{ type=info }
The Scalar Aspire integration requires a container solution such as **Docker** or **Podman** to be installed on your machine.
:::

1. **Install the package**

```shell
dotnet add package Scalar.Aspire
```

2. **Add the using directive**

```csharp
using Scalar.Aspire;
```

3. **Configure your Aspire application**

Add the following to your AppHost `Program.cs`:

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Add your services
var userService = builder
    .AddNpmApp("user-service", "../MyUserService")
    .WithHttpEndpoint(env: "PORT");

var bookService = builder.AddProject<Projects.BookService>("book-service");

// Add Scalar API Reference for all services
var scalar = builder.AddScalarApiReference(options =>
{
    // Configure global options. They will apply to all services
    options.WithTheme(ScalarTheme.Purple);
});

// Configure API References for specific services
scalar
    .WithApiReference(userService, options => options.AddDocument("internal", routePattern: "/documentation/{documentName}.json"))
    .WithApiReference(bookService, options => options.WithOpenApiRoutePattern("/swagger/{documentName}/swagger.json"));

builder.Build().Run();
```

You're all set! 🎉 The Aspire dashboard will show a Scalar API Reference resource that provides a unified API documentation for all your configured services.

## Key Features

- **Unified API Reference**: View documentation for all your microservices in a single interface
- **Service Discovery**: Automatically discovers and configures API endpoints from your Aspire services
- **Multi-Document Support**: Each service can expose multiple OpenAPI documents
- **Built-in Proxy**: Provides a built-in proxy to handle API requests, eliminating the need for CORS configuration in your services
- **Familiar Configuration**: Uses familiar configuration options consistent with the `Scalar.AspNetCore` integration

## Configuration Options

The `AddScalarApiReference` method accepts an optional `options` parameter, which you can use to customize Scalar using the fluent API.

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    // Fluent API
    options
        .WithTheme(ScalarTheme.Purple)
        .WithSidebar(false);
});
```

### Service-Specific Configuration

Each service must be registered using the `WithApiReference` method. The options parameter is optional and allows you to customize the configuration for each service:

```csharp
scalar
    .WithApiReference(weatherService) // Basic registration with default settings
    .WithApiReference(bookService, options =>
    {
        // Custom configuration for this service
        options.AddDocument("v1", "Book Management API");
        options.WithOpenApiRoutePattern("/swagger/{documentName}.json");
    })
    .WithApiReference(catalogService, options =>
    {
        // Configure multiple documents
        options.AddDocuments("v1", "v2", "beta");
    });
```

### Multiple OpenAPI Documents per Service

Each service can expose multiple OpenAPI documents:

```csharp
scalar.WithApiReference(catalogService, options =>
{
    options
        .AddDocument("v1", "Catalog API v1")
        .AddDocument("v2", "Catalog API v2")
        .AddDocument("admin", routePattern: "/admin/{documentName}.json");
});

// Or using AddDocuments with default patterns
scalar.WithApiReference(userService, options =>
{
    options.AddDocuments("public", "internal", "admin");
});
```

### Authentication Configuration

Authentication can be configured globally or per service:

#### Global Authentication

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

#### Service-Specific Authentication

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

### Theme and Appearance

Customize the appearance of your unified API reference:

```csharp
var scalar = builder.AddScalarApiReference(options =>
{
    options
        .WithTheme(ScalarTheme.Purple)
        .WithTitle("My Microservices API")
        .WithSidebar(true)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});
```

## Service Requirements

To integrate with Scalar Aspire, each service must expose OpenAPI/Swagger documents over HTTP. Ensure your service serves OpenAPI documentation at a reachable endpoint.

Additionally, only HTTP-based services are supported. Any resource you want to include in the API reference must implement the `IResourceWithServiceDiscovery` interface and define an endpoint named **"http"**.

### Example Service Configuration

Here's how to configure a service to work with Scalar Aspire:

```csharp
// In your service's Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
// or
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // Exposes at /openapi/{documentName}.json
    // or
    app.UseSwagger(options =>
    {
        options.RouteTemplate = "/swagger/{documentName}.json";
    });
}

app.Run();
```

## Troubleshooting

### Common Issues

**Services not appearing in API reference**:
- Ensure services are properly exposing OpenAPI documents
- Check that the `OpenApiRoutePattern` matches your service's actual route
- Verify services are running and accessible

**Authentication not working**:
- Confirm security schemes are defined in each service's OpenAPI document
- Check that scheme names match between service and Scalar configuration


For more configuration options and advanced scenarios, refer to the base [.NET ASP.NET Core documentation](https://guides.scalar.com/scalar/scalar-api-references/integrations/net-aspnet-core#configuration-options), as most configuration options are shared between the `Scalar.AspNetCore` and `Scalar.Aspire` integration.