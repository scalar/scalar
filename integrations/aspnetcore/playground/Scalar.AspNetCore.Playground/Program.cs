using APIWeaver;
using Scalar.AspNetCore;
using Scalar.AspNetCore.Playground;
using Scalar.AspNetCore.Playground.Books;
using Scalar.AspNetCore.Playground.Extensions;

var builder = WebApplication.CreateSlimBuilder(args);
builder.Services.AddSingleton<BookStore>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Add(BookSerializerContext.Default);
});

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

// Adds API versioning and OpenAPI
builder.Services.AddApiVersioningAndDocumentation();

// Adds api key authentication
builder.Services.AddAuthenticationScheme();

var app = builder.Build();

app.MapStaticAssets();

app.MapOpenApi();

Action<ScalarOptions> configureOptions = options =>
    options
        .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
        .WithFavicon("/favicon.png")
        .WithPreferredScheme(AuthConstants.ApiKeyScheme)
        .AddApiKeyAuthentication(AuthConstants.ApiKeyScheme, scheme => scheme.Value = "my-api-key")
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