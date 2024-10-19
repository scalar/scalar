using APIWeaver;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using Scalar.AspNetCore.Playground;
using Scalar.AspNetCore.Playground.Books;
using Scalar.AspNetCore.Playground.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<BookStore>();

builder.Services.AddOpenApi(options =>
{
    var tokenUrl = new Uri($"{AuthConstants.KeycloakUrl}/protocol/openid-connect/token");
    var authorizationUrl = new Uri($"{AuthConstants.KeycloakUrl}/protocol/openid-connect/auth");
    var scopes = new Dictionary<string, string>
    {
        { "profile", "Access to the profile" }
    };
    // Adds Bearer security scheme to the api
    options.AddSecurityScheme(AuthConstants.Bearer, scheme =>
    {
        scheme.Type = SecuritySchemeType.OAuth2;
        scheme.In = ParameterLocation.Header;
        scheme.Flows = new OpenApiOAuthFlows
        {
            AuthorizationCode = new OpenApiOAuthFlow
            {
                TokenUrl = tokenUrl,
                AuthorizationUrl = authorizationUrl,
                Scopes = scopes
            },
            Password = new OpenApiOAuthFlow
            {
                TokenUrl = tokenUrl,
                Scopes = scopes
            },
            Implicit = new OpenApiOAuthFlow
            {
                AuthorizationUrl = authorizationUrl,
                Scopes = scopes
            },
            ClientCredentials = new OpenApiOAuthFlow
            {
                TokenUrl = tokenUrl,
                Scopes = scopes
            }
        };
    });

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
builder.Services.AddAuthenticationSchemes();

var app = builder.Build();

app.UseStaticFiles();

app.MapOpenApi();

app.MapScalarApiReference(options =>
{
    options
        .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
        .WithTitle("My title")
        .WithTheme(ScalarTheme.Mars)
        .WithFavicon("/favicon.png")
        .WithPreferredScheme(AuthConstants.Bearer)
        .WithOAuth2Authentication(x =>
        {
            x.ClientId = "app";
        })
        .WithApiKeyAuthentication(x => x.Token = "my-api-key")
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

app.MapBookEndpoints();

app.Run();

