using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace Scalar.AspNetCore;

/// <summary>
/// Extension methods for <see cref="IEndpointRouteBuilder" /> to provide required endpoints.
/// </summary>
public static class ScalarEndpointRouteBuilderExtensions
{
    private const string DocumentName = "{documentName}";

    private const string StaticAssets = "ScalarStaticAssets";

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapScalarApiReference(_ =>{});
    }

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    /// <param name="configureOptions">An action to configure the Scalar options.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions> configureOptions)
    {
        var options = endpoints.ServiceProvider.GetService<IOptions<ScalarOptions>>()?.Value ?? new ScalarOptions();
        configureOptions(options);

        if (!options.EndpointPathPrefix.Contains(DocumentName))
        {
            throw new ArgumentException($"'EndpointPathPrefix' must define '{DocumentName}'.");
        }

        var standaloneResourceUrl = options.CdnUrl;
        if (options.LocalResources)
        {
            // Don't use default fonts provided by the CDN
            options.DefaultFonts = false;
            standaloneResourceUrl = options.LocalResourcesRoutePattern.Replace("{file}", "standalone.js");
            endpoints.MapLocalResourcesEndpoint(options);
        }

        var configuration = JsonSerializer.Serialize(options.ToScalarConfiguration(), ScalaConfigurationSerializerContext.Default.ScalarConfiguration);

        return endpoints.MapGet(options.EndpointPathPrefix, (string documentName) =>
            {
                var title = options.Title.Replace(DocumentName, documentName);
                var documentUrl = options.OpenApiRoutePattern.Replace(DocumentName, documentName);
                return Results.Content(
                    $"""
                     <!doctype html>
                     <html>
                     <head>
                         <title>{title}</title>
                         <meta charset="utf-8" />
                         <meta name="viewport" content="width=device-width, initial-scale=1" />
                     </head>
                     <body>
                         <script id="api-reference" data-url="{documentUrl}"></script>
                         <script>
                         document.getElementById('api-reference').dataset.configuration = JSON.stringify({configuration})
                         </script>
                         <script src="{standaloneResourceUrl}"></script>
                     </body>
                     </html>
                     """, "text/html");
            })
            .ExcludeFromDescription();
    }

    private static void MapLocalResourcesEndpoint(this IEndpointRouteBuilder endpoints, ScalarOptions options)
    {
        var fileProvider = new EmbeddedFileProvider(typeof(ScalarEndpointRouteBuilderExtensions).Assembly, StaticAssets);
        var fileExtensionContentTypeProvider = new FileExtensionContentTypeProvider();

        endpoints.MapGet(options.LocalResourcesRoutePattern, (string file) =>
        {
            var resourceFile = fileProvider.GetFileInfo(file);
            if (resourceFile.Exists)
            {
                var contentType = fileExtensionContentTypeProvider.TryGetContentType(file, out var type) ? type : "application/octet-stream";
                return Results.Stream(resourceFile.CreateReadStream(), contentType, lastModified: resourceFile.LastModified);
            }

            return Results.NotFound();
        }).ExcludeFromDescription();
    }
}