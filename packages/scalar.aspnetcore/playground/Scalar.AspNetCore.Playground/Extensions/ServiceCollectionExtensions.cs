using Microsoft.AspNetCore.Authentication;

namespace Scalar.AspNetCore.Playground.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static void AddAuthenticationSchemes(this IServiceCollection services)
    {
        // Adds authentication schemes
        services
            .AddAuthentication()
            .AddJwtBearer(x =>
            {
                x.Authority = AuthConstants.KeycloakUrl;
                x.RequireHttpsMetadata = false;
                x.TokenValidationParameters.ValidateAudience = false;
            })
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationSchemeHandler>(AuthConstants.ApiKey, null);

        // Adds authorization policies for the authentication schemes
        services.AddAuthorizationBuilder()
            .AddPolicy(AuthConstants.ApiKey, x =>
            {
                x.RequireAuthenticatedUser();
                x.AddAuthenticationSchemes(AuthConstants.ApiKey);
            })
            .AddPolicy(AuthConstants.Bearer, x =>
            {
                x.RequireAuthenticatedUser();
                x.AddAuthenticationSchemes(AuthConstants.Bearer);
            });
    }
}