using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.MapScalarApiReference(options =>
    {
        options
            .WithEndpointPrefix("/foo-docs/{documentName}")
            .WithOpenApiRoutePattern("/foo/{documentName}.json");
    });
    app.MapScalarApiReference(options =>
    {
        options
            .WithEndpointPrefix("/bar-docs/{documentName}")
            .WithOpenApiRoutePattern("/bar/{documentName}.json");
    });
}

app.Run();

public partial class Program;