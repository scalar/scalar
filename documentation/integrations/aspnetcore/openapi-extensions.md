# Scalar OpenAPI Extensions

Scalar provides extension methods and attributes to enhance your OpenAPI documents with additional metadata that improves the API Reference experience.

## Prerequisites

To generate Scalar extensions from ASP.NET Core endpoint metadata, install and configure a companion package:

**For `Microsoft.AspNetCore.OpenApi`:**
```shell
dotnet add package Scalar.AspNetCore.Microsoft
```

**For `Swashbuckle.AspNetCore.SwaggerGen`:**
```shell
dotnet add package Scalar.AspNetCore.Swashbuckle
```

Add the appropriate transformers/filters during OpenAPI registration:

```csharp
using Scalar.AspNetCore;

// Microsoft.AspNetCore.OpenApi
builder.Services.AddOpenApi(options => options.AddScalarTransformers());

// Swashbuckle.AspNetCore.SwaggerGen
builder.Services.AddSwaggerGen(options => options.AddScalarFilters());
```

## Extensions Overview

### API Stability

Mark endpoints with their stability status to help developers understand production readiness:

```csharp
// Minimal APIs
app.MapGet("/products", GetProducts).Stable();
app.MapGet("/beta-features", GetBetaFeatures).Experimental(); 
app.MapGet("/legacy-endpoint", GetLegacyData).Deprecated();

// Controllers
[HttpGet]
[Stability(Stability.Stable)]
public IActionResult GetProducts() => Ok();
```

**Stability Levels:**
- `Stable`: Production-ready API
- `Experimental`: API likely to change, not recommended for production  
- `Deprecated`: API will be removed in a future release

### Exclude From API Reference

Hide internal endpoints from the API Reference while keeping them in the OpenAPI document:

```csharp
// Minimal APIs
app.MapGet("/internal/metrics", GetMetrics).ExcludeFromApiReference();

// Controllers
[HttpGet]
[ExcludeFromApiReference]
public IActionResult GetInternalMetrics() => Ok();
```

> [!NOTE]
> Endpoints remain accessible via the API but won't appear in the API Reference interface.

### Code Samples

Add custom code examples to help developers understand how to use your endpoints:

```csharp
// Minimal APIs
app.MapPost("/orders", CreateOrder)
    .CodeSample("fetch('/orders', { method: 'POST', body: JSON.stringify(order) })", 
                ScalarTarget.JavaScript, "Create Order")
    .CodeSample("curl -X POST /orders -d @order.json", 
                ScalarTarget.Shell, "Create with cURL");

// Controllers  
[HttpGet]
[CodeSample("fetch('/products').then(r => r.json())", ScalarTarget.JavaScript)]
public IActionResult GetProducts() => Ok();
```

### Badges

Add visual badges to operations. Each operation can have multiple badges, and you can configure their position and color:

```csharp
// Minimal APIs
app.MapGet("/alpha-feature", GetAlphaFeature)
    .WithBadge("Alpha")
    .WithBadge("Beta", BadgePosition.Before)
    .WithBadge("Internal", BadgePosition.After, "#ff6b35");

app.MapPost("/orders", CreateOrder)
    .WithBadge("New", color: "#28a745")
    .WithBadge("Premium", BadgePosition.Before, "#ffc107");

// Controllers
[HttpGet]
[Badge("New")]
[Badge("V2", BadgePosition.After, "#007bff")]
public IActionResult GetExperimentalFeature() => Ok();
```

**Badge Options:**
- `name`: The text displayed in the badge (required)
- `position`: Where the badge appears relative to the operation header
- `color`: Badge color in any CSS format (hex, rgb, keywords, etc.)

### Multipart field names for ASP.NET Core

Set `x-scalar-multipart-naming: aspnet-core` on the `multipart/form-data` media type in an operation's request body to use ASP.NET Core `[FromForm]` field names. The extension is read from the API description and works with any Scalar integration.

```yaml
requestBody:
  content:
    multipart/form-data:
      x-scalar-multipart-naming: aspnet-core
      schema:
        type: object
        required: [Certificates]
        properties:
          Certificates:
            type: array
            items:
              type: object
              properties:
                name:
                  type: string
                file:
                  type: string
                  format: binary
```

The form editor, requests, and code snippets use names like `Certificates[0].name` and `Certificates[0].file`. Single nested objects use names like `Profile.file`. Arrays of scalar values or files use repeated parts with the same name. If you enter array items manually, use consecutive indices starting at zero.

Omit the extension to use normal OpenAPI multipart encoding. The extension applies to named form fields. Ordered multipart and nested MIME parts use their declared encoding.
