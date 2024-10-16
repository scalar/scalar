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

    internal const string ScalarJavaScriptFile = "scalar.js";

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
            throw new ArgumentException($"'{nameof(ScalarOptions.EndpointPathPrefix)}' must define '{DocumentName}'.");
        }

        var useLocalAssets = string.IsNullOrEmpty(options.CdnUrl);
        var standaloneResourceUrl = useLocalAssets ? options.EndpointPathPrefix.Replace(DocumentName, ScalarJavaScriptFile) : options.CdnUrl;

        var fileProvider = new EmbeddedFileProvider(typeof(ScalarEndpointRouteBuilderExtensions).Assembly, StaticAssets);
        var fileExtensionContentTypeProvider = new FileExtensionContentTypeProvider();

        var scalarConfiguration = options.ToScalarConfiguration();

        scalarConfiguration._integration = "dotnet";

        var configuration = JsonSerializer.Serialize(scalarConfiguration, ScalaConfigurationSerializerContext.Default.ScalarConfiguration);

        return endpoints.MapGet(options.EndpointPathPrefix, (string documentName) =>
            {
                // Handle static assets
                if (useLocalAssets)
                {
                    var resourceFile = fileProvider.GetFileInfo(documentName);
                    if (resourceFile.Exists)
                    {
                        var contentType = fileExtensionContentTypeProvider.TryGetContentType(documentName, out var type) ? type : "application/octet-stream";
                        return Results.Stream(resourceFile.CreateReadStream(), contentType, lastModified: resourceFile.LastModified);
                    }
                }

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
}
