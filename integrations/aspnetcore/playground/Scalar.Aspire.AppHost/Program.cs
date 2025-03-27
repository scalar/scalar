using Projects;
using Scalar.Aspire;
using Scalar.AspNetCore;

var builder = DistributedApplication.CreateBuilder(args);

var firstBookstore = builder.AddProject<Scalar_AspNetCore_Playground>("bookstore-first");
var secondBookstore = builder.AddProject<Scalar_AspNetCore_Playground>("bookstore-second");

var scalar = builder.AddScalarApiReference(options =>
{
    options.AutoProxy = true;
    options.CdnUrl = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
    options.Title = "Aspire API Reference";
    options
        .WithPreferredScheme("ApiKey")
        .WithApiKeyAuthentication(x => x.Token = "my-api-key");
}).WithHttpsEndpoint(54678, isProxied: false);

scalar
    .WithReference(firstBookstore, options =>
    {
        options
            .AddDocuments("v1", "v2")
            .WithTheme(ScalarTheme.DeepSpace);
    })
    .WithReference(secondBookstore, options =>
    {
        options
            .AddDocuments("v1", "v2")
            .WithTheme(ScalarTheme.Mars);
    });

builder.Build().Run();