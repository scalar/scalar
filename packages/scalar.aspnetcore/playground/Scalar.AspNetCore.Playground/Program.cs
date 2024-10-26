using APIWeaver;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using Scalar.AspNetCore.Playground;
using Scalar.AspNetCore.Playground.Books;
using Scalar.AspNetCore.Playground.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<BookStore>();

builder.Services.AddApiWeaver(options =>
{
    options.AddExample(new Book
    {
        BookId = Guid.NewGuid(),
        Title = "Scalar - The Next Generation",
        Description = "A book about Scalar",
        Pages = 69
    });
});

builder.Services.AddOpenApi(options =>
{
    // Adds api key security scheme to the api
    options.AddSecurityScheme(AuthConstants.ApiKey, scheme =>
    {
        scheme.Type = SecuritySchemeType.ApiKey;
        scheme.In = ParameterLocation.Header;
        scheme.Name = "X-Api-Key";
    });

    // Adds 401 and 403 responses to operations
    options.AddAuthResponse();
});

// Adds api key authentication to the api
builder.Services.AddAuthenticationScheme();

var app = builder.Build();

app.UseStaticFiles();

app.MapOpenApi();

app.MapScalarApiReference(options =>
{
    options
        .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
        .WithTheme(ScalarTheme.Mars)
        .WithFavicon("/favicon.png")
        .WithPreferredScheme(AuthConstants.ApiKey)
        .WithApiKeyAuthentication(x => x.Token = "my-api-key")
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

app.MapBookEndpoints();

app.Run();

