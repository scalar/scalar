# Scalar .NET Aspire Integration

[![Version](https://img.shields.io/nuget/v/Scalar.Aspire)](https://www.nuget.org/packages/Scalar.Aspire)
[![Downloads](https://img.shields.io/nuget/dt/Scalar.Aspire)](https://www.nuget.org/packages/Scalar.Aspire)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This .NET package `Scalar.Aspire` provides an easy way to create a unified API reference for all your .NET Aspire services based on their OpenAPI/Swagger documents.

## Features

- **Unified API Reference**: Single interface for all your services
- **Automatic Service Discovery**: Discovers and configures API endpoints from registered Aspire services  
- **Built-in Proxy**: Eliminates CORS configuration requirements
- **Individual Service Configuration**: Each service can have its own configuration, themes, and settings
- **Compatible with .NET 8 and above**
- **Familiar Configuration**: Uses the same options as `Scalar.AspNetCore`

## Usage

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
var weatherService = builder.AddProject<Projects.WeatherService>("weather-service");
var bookService = builder.AddProject<Projects.BookService>("book-service");

// Add Scalar API Reference for all services
var scalar = builder.AddScalarApiReference(options =>
{
    options.WithTheme(ScalarTheme.Purple);
});

// Add OpenAPI references for each services
scalar
    .WithApiReference(weatherService)
    .WithApiReference(bookService);

builder.Build().Run();
```

You're all set! 🎉 The Aspire dashboard will show a Scalar API Reference resource that provides unified API documentation for all your configured services.

## Service Requirements

Each service that you want to include in the unified API reference must:

1. **Expose OpenAPI documents** - Generate and serve OpenAPI/Swagger documents
2. **Be registered** - Use `WithOpenApiReference()` to register each service

### Example Service Configuration

Configure your individual services to expose OpenAPI documents:

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
        options.RouteTemplate = "/openapi/{documentName}.json";
    });
}

app.Run();
```

## Configuration

For detailed configuration options including authentication, multiple documents, themes, and advanced scenarios, refer to the [Aspire integration documentation](https://github.com/scalar/scalar/blob/main/documentation/integrations/aspire.md).

## Local Development

### Prerequisites

- Docker
- .NET 9 SDK

### Building the Scalar.Aspire.Service

To build the Docker image for the `Scalar.Aspire.Service`, run the following command from the root directory:

```bash
docker build --no-cache -t scalarapi/aspire-api-reference:latest -f ./src/Scalar.Aspire.Service/Dockerfile .
```

### Running the Aspire Host

After building the Docker image, you can run the Aspire host located in the playground:

```bash
cd playground/Scalar.Aspire.AppHost
dotnet run
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).