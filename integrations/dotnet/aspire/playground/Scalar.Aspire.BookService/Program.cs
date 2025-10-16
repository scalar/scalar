using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();

var keycloakUrl = builder.Configuration["keycloak"];
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.OpenIdConnect,
            OpenIdConnectUrl = new Uri($"{keycloakUrl}/realms/scalar/.well-known/openid-configuration"),
            Description = "My OIDC"
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes.Add("oidc", securityScheme);

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

app.UseCors(policy =>
{
    policy
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod();
});
app.UseHttpsRedirection();

app.MapOpenApi("/swagger/{documentName}.json");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!").RequireAuthorization();

app.Run();