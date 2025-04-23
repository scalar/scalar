using APIWeaver;
using Asp.Versioning.ApiExplorer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.OpenApi.Models;

namespace Scalar.AspNetCore.Playground.Extensions;

internal static class ServiceCollectionExtensions
{
    internal static void AddAuthenticationScheme(this IServiceCollection services)
    {
        services.AddAuthentication(AuthConstants.ApiKeyScheme)
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationSchemeHandler>(AuthConstants.ApiKeyScheme, null);
        services.AddAuthorization();
    }

    internal static void AddApiVersioningAndDocumentation(this IServiceCollection services)
    {
        services.AddApiVersioning().AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

        string[] versions = ["v1", "v2"];

        foreach (var version in versions)
        {
            services.Configure<ScalarOptions>(options => options.AddDocument(version, $"Version {version}"));
            services.AddOpenApi(version, options =>
            {
                // Adds api key security scheme to the api
                options.AddSecurityScheme(AuthConstants.ApiKeyScheme, scheme =>
                {
                    scheme.Type = SecuritySchemeType.ApiKey;
                    scheme.In = ParameterLocation.Header;
                    scheme.Name = "X-Api-Key";
                });

                // Adds 401 and 403 responses to operations
                options.AddAuthResponse();

                options.AddDocumentTransformer((document, context) =>
                {
                    var descriptionProvider = context.ApplicationServices.GetRequiredService<IApiVersionDescriptionProvider>();
                    var versionDescription = descriptionProvider.ApiVersionDescriptions.FirstOrDefault(x => x.GroupName == version);
                    document.Info.Version = versionDescription?.ApiVersion.ToString();
                });
                options.AddDocumentTransformer((document, _) => document.Servers = []);
            });
        }
    }
}