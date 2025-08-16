# Legacy .NET Integration

This guide explains how to integrate Scalar API Reference into .NET Framework and .NET Core projects using static assets.

## Prerequisites

- An ASP.NET or ASP.NET Core application with OpenAPI support (using `Swashbuckle.AspNetCore.SwaggerGen` or `NSwag`)


## Step 1: Enable OpenAPI support in your project

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

## Step 2: Create the directory structure

Create the following folder structure:

```
wwwroot/ (or your static files directory)
└── scalar/
    ├── index.html
    └── scalar.config.js
```

## Step 3: Create the HTML file for Scalar

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

## Step 4: Create the configuration file

Create `scalar.config.js` in the same directory:

```javascript
Scalar.initialize({
    selector: "#app",
    url: "/swagger/v1/swagger.json", // Adjust this URL to match your OpenAPI document path
    theme: "moon" // Other configuration
});
```

## Step 5: Accessing your API Reference

After starting your application, the Scalar API Reference will be available at:

```
http://localhost:<port>/scalar/index.html
```

### Using a specific Scalar version

To use a specific version instead of the latest, specify the version in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.28.23"></script>
```

## Troubleshooting

- **OpenAPI document doesn't load**: Verify the URL path to your OpenAPI document in the configuration
- **CORS issues**: Ensure your API allows CORS if hosted on a different domain
- **Static files not serving**: Check that `app.UseStaticFiles()` is present in your middleware pipeline
- **404 errors**: Confirm the directory structure and that the files are correctly named

For more configuration options, refer to the [official Scalar configuration documentation](https://guides.scalar.com/scalar/scalar-api-references/configuration).
