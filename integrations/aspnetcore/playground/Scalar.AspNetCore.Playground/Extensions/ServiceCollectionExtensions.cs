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
                options.AddDocumentTransformer((document, _, _) =>
                {
                    var securityScheme = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.ApiKey,
                        In = ParameterLocation.Header,
                        Name = "X-Api-Key"
                    };
                    document.Components ??= new OpenApiComponents();
                    document.Components.SecuritySchemes ??= [];
                    document.Components.SecuritySchemes.Add(AuthConstants.ApiKeyScheme, securityScheme);
                    return Task.CompletedTask;
                });

                options.AddDocumentTransformer((document, context, _) =>
                {
                    var descriptionProvider = context.ApplicationServices.GetRequiredService<IApiVersionDescriptionProvider>();
                    var versionDescription = descriptionProvider.ApiVersionDescriptions.FirstOrDefault(x => x.GroupName == version);
                    document.Info.Version = versionDescription?.ApiVersion.ToString();
                    return Task.CompletedTask;
                });
                options.AddDocumentTransformer((document, _, _) =>
                {
                    document.Servers = [];
                    return Task.CompletedTask;
                });
                options.AddScalarTransformers();
            });
        }
    }
}