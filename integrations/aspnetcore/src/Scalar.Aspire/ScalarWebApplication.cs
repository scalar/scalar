using Aspire.Hosting.ApplicationModel;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

namespace Scalar.Aspire;

internal static class ScalarWebApplication
{
    internal static WebApplication Create(IServiceProvider serviceProvider, ScalarResource scalarResource)
    {
        var builder = WebApplication.CreateBuilder();

        // Todo: Unclear how to tackle ports and schemas
        var endpointAnnotations = scalarResource.Annotations
            .OfType<EndpointAnnotation>()
            .Select(annotation => $"{annotation.UriScheme}://{annotation.TargetHost}:{annotation.Port}")
            .ToArray();

        // If any endpoint was configured, use them. Otherwise, use random ports
        var hostUrls = endpointAnnotations.Length > 0 ? endpointAnnotations : ["http://*:0", "https://*:0"];

        builder.WebHost.UseUrls(hostUrls);
        builder.Services.AddHttpForwarder();

        var app = builder.Build();
        var configurations = CreateConfigurations(serviceProvider, scalarResource);

        var scalarAspireOptions = serviceProvider.GetRequiredService<IOptions<ScalarAspireOptions>>().Value;

        var endpointOptions = new ScalarEndpointOptions(
            scalarAspireOptions.CdnUrl,
            scalarAspireOptions.Title,
            scalarAspireOptions.HeadContent,
            scalarAspireOptions.HeaderContent
        );

        app.MapScalarApiReference("/", endpointOptions, configurations);

        if (scalarAspireOptions.AutoProxy)
        {
            app.MapScalarProxy();
        }

        return app;
    }

    private static List<ScalarApiReferenceOptions> CreateConfigurations(IServiceProvider serviceProvider, ScalarResource scalarResource)
    {
        List<ScalarApiReferenceOptions> configurations = [];
        var scalarAnnotations = scalarResource.Annotations.OfType<ScalarAnnotation>();

        foreach (var scalarAnnotation in scalarAnnotations)
        {
            var resourceName = scalarAnnotation.ProjectResource.Name;

            using var scope = serviceProvider.CreateScope();
            var scalarAspireOptions = scope.ServiceProvider.GetRequiredService<IOptionsSnapshot<ScalarAspireOptions>>().Value;
            scalarAnnotation.ConfigureOptions?.Invoke(scalarAspireOptions);

            ConfigureOpenApiServers(scalarAspireOptions, scalarAnnotation);
            ConfigureOpenApiRoutePattern(scalarAspireOptions, scalarAnnotation);

            if (scalarAspireOptions.AutoProxy)
            {
                ConfigureProxyUrl(scalarAspireOptions);
            }

            ConfigureDocuments(scalarAspireOptions, resourceName);

            configurations.Add(scalarAspireOptions);
        }

        return configurations;
    }

    private static void ConfigureOpenApiServers(ScalarAspireOptions scalarOptions, ScalarAnnotation scalarAnnotation)
    {
        // Only set OpenAPI servers if not already assigned
        scalarOptions.Servers ??= scalarAnnotation.ProjectResource
            .GetEndpoints()
            .Select(endpoint => new ScalarServer(endpoint.Url))
            .ToList();
    }

    private static void ConfigureOpenApiRoutePattern(ScalarAspireOptions scalarOptions, ScalarAnnotation scalarAnnotation)
    {
        // Only set the full URL if the OpenAPI route pattern is not a full URL
        if (!RegexHelper.HttpUrlPattern().IsMatch(scalarOptions.OpenApiRoutePattern))
        {
            // Todo: Currently hard coded https
            var endpointReference = scalarAnnotation.ProjectResource.GetEndpoint("https");
            scalarOptions.OpenApiRoutePattern = $"{endpointReference.Url}/{scalarOptions.OpenApiRoutePattern.TrimStart('/')}";
        }
    }

    private static void ConfigureProxyUrl(ScalarAspireOptions scalarOptions)
    {
        // Only set the proxy URL if not already assigned
        scalarOptions.ProxyUrl ??= "/proxy";
    }

    private static void ConfigureDocuments(ScalarAspireOptions scalarOptions, string resourceName)
    {
        // If no document names are provided, fallback to the default document name
        if (scalarOptions.Documents.Count == 0)
        {
            scalarOptions.AddDocument("v1");
        }

        // Process each document
        for (var index = 0; index < scalarOptions.Documents.Count; index++)
        {
            var document = scalarOptions.Documents[index];
            // Prefix the title with the resource name
            var title = document.Title ?? document.Name;

            document = document with
            {
                Title = $"{resourceName} | {title}"
            };

            // Only set the full URL if the OpenAPI route pattern is not a full URL
            if (document.RoutePattern is not null && !RegexHelper.HttpUrlPattern().IsMatch(document.RoutePattern))
            {
                document = document with
                {
                    RoutePattern = $"{scalarOptions.OpenApiRoutePattern}/{document.RoutePattern.TrimStart('/')}"
                };
            }

            scalarOptions.Documents[index] = document;
        }
    }
}