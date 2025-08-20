using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var keycloakUrl = builder.Configuration["keycloak"];
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.OAuth2,
            Flows = new OpenApiOAuthFlows
            {
                AuthorizationCode = new OpenApiOAuthFlow
                {
                    // localhost for the user interaction
                    AuthorizationUrl = new Uri($"{keycloakUrl}/realms/scalar/protocol/openid-connect/auth"),
                    // keycloak for the proxy
                    TokenUrl = new Uri("http://keycloak/realms/scalar/protocol/openid-connect/token")
                }
            }
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes.Add("oauth2", securityScheme);

        var securityRequirement = new OpenApiSecurityRequirement
        {
            [securityScheme] = []
        };
        document.SecurityRequirements = [securityRequirement];

        return Task.CompletedTask;
    });
});

builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.Authority = $"{keycloakUrl}/realms/scalar";
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters.ValidateIssuer = false;
    options.TokenValidationParameters.ValidateAudience = false;
});
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseHttpsRedirection();

app.MapOpenApi("/swagger/{documentName}.json");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!").RequireAuthorization();

app.Run();