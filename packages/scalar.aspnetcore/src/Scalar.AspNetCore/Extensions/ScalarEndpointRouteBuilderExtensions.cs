using System.Diagnostics.CodeAnalysis;
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

    private const string DefaultPattern = "/scalar/{documentName}";

    private const string StaticAssets = "ScalarStaticAssets";

    internal const string ScalarJavaScriptFile = "scalar.js";

    private static readonly EmbeddedFileProvider FileProvider = new(typeof(ScalarEndpointRouteBuilderExtensions).Assembly, StaticAssets);

    private static readonly FileExtensionContentTypeProvider FileExtensionContentTypeProvider = new();

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapScalarApiReference(_ =>
        {
        });
    }

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    /// <param name="configureOptions">An action to configure the Scalar options, with access to the <see cref="HttpContext" />.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions, HttpContext> configureOptions) =>
        endpoints.MapScalarApiReference(DefaultPattern, configureOptions);

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    /// <param name="configureOptions">An action to configure the Scalar options.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions> configureOptions)
    {
        var legacyOptions = endpoints.ServiceProvider.GetRequiredService<IOptions<ScalarOptions>>().Value;
        configureOptions.Invoke(legacyOptions);

        // Support for old `EndpointPathPrefix` property
#pragma warning disable CS0618 // Type or member is obsolete
        var pattern = legacyOptions.EndpointPathPrefix != DefaultPattern ? legacyOptions.EndpointPathPrefix : DefaultPattern;
#pragma warning restore CS0618 // Type or member is obsolete
        return endpoints.MapScalarApiReference(pattern, (options, _) => configureOptions(options));
    }

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    /// <param name="pattern">The URL pattern for the endpoint.</param>
    /// <param name="configureOptions">An action to configure the Scalar options.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, [StringSyntax("Route")] string pattern, Action<ScalarOptions> configureOptions)
    {
        return endpoints.MapScalarApiReference(pattern, (options, _) => configureOptions(options));
    }

    /// <summary>
    /// Maps the Scalar API reference endpoint.
    /// </summary>
    /// <param name="endpoints"><see cref="IEndpointRouteBuilder" />.</param>
    /// <param name="pattern">The URL pattern for the endpoint.</param>
    /// <param name="configureOptions">An action to configure the Scalar options, with access to the <see cref="HttpContext" />.</param>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, [StringSyntax("Route")] string pattern, Action<ScalarOptions, HttpContext>? configureOptions = null)
    {
        if (!pattern.Contains(DocumentName))
        {
            throw new ArgumentException($"'{nameof(pattern)}' must define '{DocumentName}'.");
        }

        var optionsMonitor = endpoints.ServiceProvider.GetRequiredService<IOptionsMonitor<ScalarOptions>>();

        return endpoints.MapGet(pattern, (string documentName, HttpContext httpContext) =>
        {
            // Handle static assets
            var resourceFile = FileProvider.GetFileInfo(documentName);
            if (resourceFile.Exists)
            {
                var contentType = FileExtensionContentTypeProvider.TryGetContentType(documentName, out var type) ? type : "application/octet-stream";
                return Results.Stream(resourceFile.CreateReadStream(), contentType, lastModified: resourceFile.LastModified);
            }

            var options = optionsMonitor.Get(documentName);
            configureOptions?.Invoke(options, httpContext);
            var title = options.Title.Replace(DocumentName, documentName);
            var useLocalAssets = string.IsNullOrEmpty(options.CdnUrl);
            var standaloneResourceUrl = useLocalAssets ? ScalarJavaScriptFile : options.CdnUrl;
            var documentUrl = options.OpenApiRoutePattern.Replace(DocumentName, documentName);
            var configuration = JsonSerializer.Serialize(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

            return Results.Content(
                $$"""
                  <!doctype html>
                  <html>
                  <head>
                      <title>{{title}}</title>
                      <meta charset="utf-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1" />
                  </head>
                  <body>
                      <script id="api-reference"></script>
                      <script>
                          function getBasePath() {
                              const pathSegments = window.location.pathname.split('{{httpContext.Request.Path}}')
                              console.log(pathSegments)
                              const basePath = pathSegments[0] === '/' ? '' : pathSegments[0]
                              console.log(basePath)
                              return basePath
                          }
                          const openApiUrl = `${window.location.origin}${getBasePath()}{{documentUrl}}`
                          console.log(openApiUrl)
                          const reference = document.getElementById('api-reference')
                          reference.dataset.url = openApiUrl;
                          reference.dataset.configuration = JSON.stringify({{configuration}})
                      </script>
                      <script src="{{standaloneResourceUrl}}"></script>
                  </body>
                  </html>
                  """, "text/html");
        }).ExcludeFromDescription();
    }
}