# Scalar.Aspire

[![Version](https://img.shields.io/nuget/v/Scalar.Aspire)](https://www.nuget.org/packages/Scalar.Aspire)
[![Downloads](https://img.shields.io/nuget/dt/Scalar.Aspire)](https://www.nuget.org/packages/Scalar.Aspire)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This .NET package `Scalar.Aspire` provides an easy way to render beautiful API references based on OpenAPI/Swagger documents in .NET Aspire.

> **Note:** `Scalar.Aspire` is built on top of `Scalar.AspNetCore`. For more in-depth information about all available options and features, please check the [Scalar.AspNetCore documentation](../aspnetcore/README.md).

## Usage

1. **Install the package**

```shell
dotnet add package Scalar.Aspire
```

2. **Add the using directive**

```csharp
using Scalar.Aspire;
```

3. **Configure your Aspire app host project**

Add Scalar to your service registration in your Aspire AppHost project:

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Register your API project
var api = builder.AddProject<Projects.MyApi>("api");

// Add Scalar API Reference to the services
var scalar = builder.AddScalarApiReference();

// Add 
scalar.WithReference(api);
```

4. **Configure your API project**

In your API project, ensure you have OpenAPI generation set up:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Set up API Explorer and OpenAPI generation
builder.Services.AddOpenApi();

var app = builder.Build();

// Map your OpenAPI document
app.MapOpenApi();

```

That's it! 🎉 When you run your Aspire application, the Scalar API Reference will be automatically available in the Aspire dashboard.
