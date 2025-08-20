# Scalar OpenAPI Extensions

Scalar provides extension methods and attributes to enhance your OpenAPI documents with additional metadata that improves the API Reference experience.

## Prerequisites

You must install and configure one of the companion packages to enable extensions:

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

:::scalar-callout{ type=info }
Endpoints remain accessible via the API but won't appear in the Scalar API Reference interface.
:::

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
