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
builder.Services.AddHttpContextAccessor();
builder.Services.AddOpenApi(options =>
{
    options.AddServerFromRequest();
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

app.MapStaticAssets();

app.MapOpenApi();

Action<ScalarOptions> configureOptions = options => 
    options
        .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
        .WithFavicon("/favicon.png")
        .WithPreferredScheme(AuthConstants.ApiKey)
        .WithApiKeyAuthentication(x => x.Token = "my-api-key")
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);

app.MapScalarApiReference((options, context) =>
{
    configureOptions.Invoke(options);
    options.Title = context.Request.Path;
    options.WithTheme(ScalarTheme.Mars);
});

app.MapScalarApiReference("/", configureOptions);

app.MapBookEndpoints();

app.Run();