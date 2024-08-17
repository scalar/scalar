# Scalar .NET API Reference Integration

This .NET packages provides an easy way to render a beautiful API reference based on an OpenAPI/Swagger. Made possible by the wonderful work of [captainsafia](https://github.com/captainsafia) on [building the integration & docs written](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/aspnetcore-openapi?view=aspnetcore-9.0&tabs=visual-studio#using-scalar-for-interactive-api-documentation) for the Scalar & .NET integration.

![dotnet](./dotnet.jpg)

## Installation

```bash
dotnet add package Scalar.AspNetCore
```

## Usage

Set up [Microsoft.AspNetCore.OpenApi](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/aspnetcore-openapi?view=aspnetcore-9.0&tabs=visual-studio)

```c#
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder();

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapGet("/", () => "Hello world!");

app.Run();
```

.NET 8

```c#
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.RouteTemplate = "openapi/{documentName}.json";
    });
    //app.UseSwaggerUI();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

```

Now you will see the Scalar UI when using the defaults at `https://localhost:XXXXX/scalar/v1` (where XXXXX is, of course, the port for your app).

## Building & Release

```bash
dotnet build
dotnet pack --configuration Release
# then ping marc until we set up ci auto release!
```
