using Scalar.AspNetCore;
using Scalar.AspNetCore.Playground;
using Scalar.AspNetCore.Playground.Books;
using Scalar.AspNetCore.Playground.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<BookStore>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Add(BookSerializerContext.Default);
});

// Adds API versioning and OpenAPI
builder.Services.AddApiVersioningAndDocumentation();

// Adds api key authentication
builder.Services.AddAuthenticationScheme();

var app = builder.Build();

app.MapStaticAssets();

app.MapOpenApi();

Action<ScalarOptions> configureOptions = options =>
    options
        .WithJavaScriptConfiguration("./scalar/config.js")
        .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
        .AddApiKeyAuthentication(AuthConstants.ApiKeyScheme, scheme => scheme.Value = "my-api-key")
        .AddPreferredSecuritySchemes(AuthConstants.ApiKeyScheme)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);

app.MapScalarApiReference(options =>
{
    configureOptions.Invoke(options);
    options.WithTheme(ScalarTheme.Mars);
});

app.MapScalarApiReference("/", configureOptions);

app.MapScalarApiReference("/scalar-url-pattern", (options, context) =>
{
    configureOptions.Invoke(options);
    options.OpenApiRoutePattern = $"{context.Request.Scheme}://{context.Request.Host}/openapi/{{documentName}}.json";
});

app.MapBookEndpoints();

app.Run();