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

## Server URL Configuration

### Base Server URL

You can configure a base URL that will be prepended to all relative server URLs defined in your OpenAPI document. This is useful when your API is deployed behind a reverse proxy or when you want to ensure all server URLs have the correct base path.

```csharp
app.MapScalarApiReference(options => options.WithBaseServerUrl("https://api.example.com/my-api"));
```

For example, if your OpenAPI document defines a server URL as `/server`, it will be transformed to `https://api.example.com/my-api/server`.

### Dynamic Base Server URL

Alternatively, you can enable dynamic base server URL detection, which will automatically use the request's scheme, host, and path base to construct the base URL:

```csharp
app.MapScalarApiReference(options =>  options.WithDynamicBaseServerUrl());
```

When enabled, if your application receives a request to `https://api.example.com/my-api/scalar`, any relative server URLs in your OpenAPI document will be automatically prefixed with `https://api.example.com/my-api`.

### Combined Configuration Example

Here's a complete example showing how to use these options together:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapScalarApiReference(options => {
    options
      .AddDocuments("v1", "v2")
      .WithDynamicBaseServerUrl();
});
```

When both `BaseServerUrl` and `DynamicBaseServerUrl` are configured, `DynamicBaseServerUrl` takes precedence. Only relative server URLs are affected by these options; absolute URLs remain unchanged.