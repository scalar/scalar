# Subpath Deployment

When deploying your API under a subpath (e.g., `https://api.example.com/my-api`), Scalar automatically handles the OpenAPI document URLs by adjusting them according to the base path. This guide explains how to configure subpath deployment with Scalar.

## Important Note on Root Deployment

When your API is deployed under a subpath (e.g., `/my-api`), it's recommended to deploy Scalar under a subpath as well (e.g., `/my-api/scalar`). Deploying Scalar at the root path (`/`) while the API is under a subpath may lead to unexpected behavior with OpenAPI document URL resolution.

Recommended configuration:
- API: `https://api.example.com/my-api`
- Scalar API Reference endpoint: `/scalar`
- OpenAPI document endpoint: `/openapi/v1.json`

## Automatic Base Path Detection

Scalar automatically detects the base path of your application and updates the OpenAPI document URLs accordingly. This means you don't need any additional configuration for the UI to work correctly when following the recommended deployment pattern.

## Configuration Options

### 1. Path Stripping by Reverse Proxy

If your reverse proxy strips the base path (common with nginx, Apache, or Caddy), no additional configuration is needed in your ASP.NET Core application:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference("/scalar"); // Recommended: Deploy under a subpath
```

### 2. Without Path Stripping

If your reverse proxy preserves the base path, configure your ASP.NET Core application to use the base path:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the base path
app.UsePathBase("/my-api");

// Must be called after UsePathBase
app.UseRouting();

app.MapOpenApi();
app.MapScalarApiReference();
```

## Example with Multiple Documents

When using multiple OpenAPI documents with subpath deployment:

```csharp
string[] versions = ["v1", "v2"];

app.UsePathBase("/my-api");
app.UseRouting();

app.MapScalarApiReference(options =>  options.AddDocuments("v1", "v2"));
```

Scalar will automatically handle the base path for all document URLs.