using System.Diagnostics.CodeAnalysis;
using System.Net.Mime;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
#if RELEASE
using System.IO.Compression;
#endif

namespace Scalar.AspNetCore;

/// <summary>
/// Extension methods for <see cref="IEndpointRouteBuilder" /> to provide required endpoints.
/// </summary>
public static class ScalarEndpointRouteBuilderExtensions
{
    private const string DocumentName = "{documentName}";
    private const string LegacyPattern = $"/scalar/{DocumentName}";
    private const string DefaultEndpointPrefix = "/scalar";
    private const string ScalarJavaScriptFile = "scalar.js";
    private const string ScalarJavaScriptHelperFile = "scalar.aspnetcore.js";

    private static readonly EmbeddedFileProvider FileProvider = new(typeof(ScalarEndpointRouteBuilderExtensions).Assembly, "ScalarStaticAssets");

    /// <summary>
    /// Maps the Scalar API reference endpoint with the default endpoint prefix <c>'/scalar'</c>.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder" /> to which the endpoint will be added.</param>
    /// <remarks>
    /// Redirects to the trailing from <c>'/scalar'</c> to <c>'/scalar/'</c>.
    /// This ensures that the relative paths in the generated HTML are correct.
    /// <br />
    /// This method overload is compatible with the obsolete <see cref="ScalarOptions.EndpointPathPrefix" /> property.
    /// </remarks>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints) => MapScalarApiReferenceLegacy(endpoints);

    /// <summary>
    /// Maps the Scalar API reference endpoint with the default endpoint prefix <c>'/scalar'</c> and custom options.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder" /> to which the endpoint will be added.</param>
    /// <param name="configureOptions">An action to configure <see cref="ScalarOptions" />.</param>
    /// <remarks>
    /// Redirects to the trailing from <c>'/scalar'</c> to <c>'/scalar/'</c>.
    /// This ensures that the relative paths in the generated HTML are correct.
    /// <br />
    /// This method overload is compatible with the obsolete <see cref="ScalarOptions.EndpointPathPrefix" /> property.
    /// </remarks>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions> configureOptions) => MapScalarApiReferenceLegacy(endpoints, configureOptions);

    /// <summary>
    /// Maps the Scalar API reference endpoint with the default endpoint prefix <c>'/scalar'</c> and custom options, providing access to the <see cref="HttpContext" />.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder" /> to which the endpoint will be added.</param>
    /// <param name="configureOptions">An optional action to configure <see cref="ScalarOptions" />, which includes access to the <see cref="HttpContext" />.</param>
    /// <remarks>
    /// Redirects to the trailing from <c>'/scalar'</c> to <c>'/scalar/'</c>.
    /// This ensures that the relative paths in the generated HTML are correct.
    /// </remarks>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions, HttpContext>? configureOptions) =>
        endpoints.MapScalarApiReference(DefaultEndpointPrefix, configureOptions);

    /// <summary>
    /// Maps the Scalar API reference endpoint with a custom endpoint prefix and options.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder" /> to which the endpoint will be added.</param>
    /// <param name="endpointPrefix">The prefix for the endpoint.</param>
    /// <param name="configureOptions">An action to configure <see cref="ScalarOptions" />.</param>
    /// <exception cref="ArgumentException">Thrown when the <paramref name="endpointPrefix" /> contains the <c>'{documentName}'</c> placeholder.</exception>
    /// <remarks>
    /// Redirects to the trailing slash if <paramref name="endpointPrefix" /> does not end with a slash (e.g., from <c>'/scalar'</c> to <c>'/scalar/'</c>).
    /// This ensures that the relative paths in the generated HTML are correct.
    /// <br />
    /// It's also possible to provide a document name as a route parameter in the browser (e.g., <c>'/scalar/v1'</c>).
    /// </remarks>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, [StringSyntax("Route")] string endpointPrefix, Action<ScalarOptions> configureOptions)
    {
        return endpoints.MapScalarApiReference(endpointPrefix, (options, _) => configureOptions(options));
    }

    /// <summary>
    /// Maps the Scalar API reference endpoint with a custom endpoint prefix and options, providing access to the <see cref="HttpContext" />.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder" /> to which the endpoint will be added.</param>
    /// <param name="endpointPrefix">The prefix for the endpoint.</param>
    /// <param name="configureOptions">An optional action to configure <see cref="ScalarOptions" />, which includes access to the <see cref="HttpContext" />.</param>
    /// <exception cref="ArgumentException">Thrown when the <paramref name="endpointPrefix" /> contains the <c>'{documentName}'</c> placeholder.</exception>
    /// <remarks>
    /// Redirects to the trailing slash if <paramref name="endpointPrefix" /> does not end with a slash (e.g., from <c>'/scalar'</c> to <c>'/scalar/'</c>).
    /// This ensures that the relative paths in the generated HTML are correct.
    /// <br />
    /// It's also possible to provide a document name as a route parameter in the browser (e.g., <c>'/scalar/v1'</c>).
    /// </remarks>
    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, [StringSyntax("Route")] string endpointPrefix, Action<ScalarOptions, HttpContext>? configureOptions = null)
    {
        // Validate the endpoint prefix. The {documentName} placeholder is reserved for the '{documentName?}' route parameter.
        if (endpointPrefix.Contains(DocumentName))
        {
            throw new ArgumentException($"The endpoint prefix cannot contain the '{DocumentName}' placeholder.", nameof(endpointPrefix));
        }

        var scalarEndpointGroup = endpoints.MapGroup(endpointPrefix).ExcludeFromDescription();

        // Handle static assets
        scalarEndpointGroup.MapStaticAssetsEndpoint();

        return scalarEndpointGroup.MapGet("/{documentName?}", (HttpContext httpContext, IOptionsSnapshot<ScalarOptions> optionsSnapshot, string? documentName) =>
        {
            if (ShouldRedirectToTrailingSlash(httpContext, documentName, out var redirectUrl))
            {
                return Results.Redirect(redirectUrl);
            }

            var options = optionsSnapshot.Value;
            configureOptions?.Invoke(options, httpContext);

            ConfigureDocuments(options, documentName);

            var configuration = options.ToScalarConfiguration();
            var serializedConfiguration = JsonSerializer.Serialize(configuration, typeof(ScalarConfiguration), ScalarConfigurationSerializerContext.Default);
            UpdateTitleWithDocumentName(options);
            
            var scalarEndpointOptions = new ScalarEndpointOptions(options.CdnUrl, options.Title, options.HeadContent, options.HeaderContent, options.DynamicBaseServerUrl);
            return GenerateContentResult(scalarEndpointOptions, httpContext.Request.Path, serializedConfiguration);

        });
    }

    /// <summary>
    /// Maps the Scalar API reference endpoint with multiple configurations.
    /// </summary>
    /// <param name="endpoints">The <see cref="IEndpointRouteBuilder" /> to which the endpoint will be added.</param>
    /// <param name="endpointPrefix">The prefix for the endpoint.</param>
    /// <param name="endpointOptions">The options for configuring the endpoint.</param>
    /// <param name="options">The collection of API reference options.</param>
    /// <remarks>
    /// This endpoint is currently used by the Aspire integration.
    /// </remarks>
    internal static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, [StringSyntax("Route")] string endpointPrefix, ScalarEndpointOptions endpointOptions,
        IEnumerable<ScalarApiReferenceOptions> options)
    {
        var scalarEndpointGroup = endpoints.MapGroup(endpointPrefix).ExcludeFromDescription();

        // Handle static assets
        scalarEndpointGroup.MapStaticAssetsEndpoint();

        return scalarEndpointGroup.MapGet("/", (HttpContext httpContext) =>
        {
            if (ShouldRedirectToTrailingSlash(httpContext, null, out var redirectUrl))
            {
                return Results.Redirect(redirectUrl);
            }

            var configurations = options.ToScalarConfigurations();
            var serializedConfigurations = JsonSerializer.Serialize(configurations, typeof(IEnumerable<ScalarConfiguration>), ScalarConfigurationSerializerContext.Default);

            return GenerateContentResult(endpointOptions, httpContext.Request.Path, serializedConfigurations);
        });
    }

    /// <summary>
    /// Helper method to support the deprecated <see cref="ScalarOptions.EndpointPathPrefix"/> property.
    /// </summary>
    private static IEndpointConventionBuilder MapScalarApiReferenceLegacy(IEndpointRouteBuilder endpoints, Action<ScalarOptions>? configureOptions = null)
    {
        // Support for obsolete `EndpointPathPrefix` property.
        using var scope = endpoints.ServiceProvider.CreateScope();
        var legacyOptions = scope.ServiceProvider.GetRequiredService<IOptionsSnapshot<ScalarOptions>>().Value;
        configureOptions?.Invoke(legacyOptions);
#pragma warning disable CS0618 // Type or member is obsolete
        // Remove '/{documentName}' from the prefix
        var prefix = legacyOptions.EndpointPathPrefix != LegacyPattern ? legacyOptions.EndpointPathPrefix.Replace($"/{DocumentName}", string.Empty) : DefaultEndpointPrefix;
#pragma warning restore CS0618 // Type or member is obsolete
        return endpoints.MapScalarApiReference(prefix, (options, _) => configureOptions?.Invoke(options));
    }

    private static void ConfigureDocuments(ScalarOptions options, string? documentName)
    {
        // If a document name is provided as route parameter, clear the document names and add the provided document name
        if (!string.IsNullOrEmpty(documentName))
        {
            options.Documents.Clear();
            options.AddDocument(documentName);
        }
        // If no document names are provided, fallback to the default document name
        else if (options.Documents.Count == 0)
        {
            options.AddDocument("v1");
        }
    }

    private static void UpdateTitleWithDocumentName(ScalarOptions options)
    {
        // Update title with document name if only one document exists
        if (options.Documents.Count == 1)
        {
            options.Title = options.Title?.Replace(DocumentName, options.Documents[0].Name);
        }
    }

    private static IResult GenerateContentResult(ScalarEndpointOptions options, string requestPath,string configuration)
    {
        var scriptUrl = string.IsNullOrEmpty(options.CdnUrl) ? ScalarJavaScriptFile : options.CdnUrl;
        return Results.Content(
            $$"""
              <!doctype html>
              <html>
              <head>
                  <title>{{options.Title}}</title>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  {{options.HeadContent}}
              </head>
              <body>
                  {{options.HeaderContent}}
                  <div id="app"></div>
                  <script type="module" src="{{ScalarJavaScriptHelperFile}}"></script>
                  <script type="module" src="{{scriptUrl}}"></script>
                  <script type="module">
                      import { initialize } from './{{ScalarJavaScriptHelperFile}}'
                      initialize(
                      '{{requestPath}}',
                      {{options.DynamicBaseServerUrl.ToString().ToLowerInvariant()}},
                      {{configuration}})
                  </script>
              </body>
              </html>
              """, "text/html");
    }

    /// <summary>
    /// Maps the endpoint for serving static assets.
    /// </summary>
    private static void MapStaticAssetsEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ScalarJavaScriptFile, static (HttpContext httpContext) => HandleStaticAsset(ScalarJavaScriptFile, httpContext)).AllowAnonymous();
        endpoints.MapGet(ScalarJavaScriptHelperFile, static (HttpContext httpContext) => HandleStaticAsset(ScalarJavaScriptHelperFile, httpContext)).AllowAnonymous();
    }

    private static IResult HandleStaticAsset(string file, HttpContext httpContext)
    {
        httpContext.Response.Headers.CacheControl = "no-cache";
        var resourceFile = FileProvider.GetFileInfo(file);
        if (!resourceFile.Exists)
        {
            // Return 404 if the file does not exist. This should not happen because the file is embedded.
            return Results.NotFound();
        }

        httpContext.Response.Headers.Append(HeaderNames.Vary, HeaderNames.AcceptEncoding);

        var etag = $"\"{resourceFile.LastModified.Ticks}\"";

        var ifNoneMatch = httpContext.Request.Headers.IfNoneMatch.ToString();
        if (ifNoneMatch == etag)
        {
            return Results.StatusCode(StatusCodes.Status304NotModified);
        }

#if RELEASE
        if (httpContext.Request.IsGzipAccepted())
        {
            httpContext.Response.Headers.ContentEncoding = "gzip";
            return Results.Stream(resourceFile.CreateReadStream(), MediaTypeNames.Text.JavaScript, entityTag: new EntityTagHeaderValue(etag));
        }

        var stream = new GZipStream(resourceFile.CreateReadStream(), CompressionMode.Decompress);
#else
        var stream = resourceFile.CreateReadStream();
#endif

        return Results.Stream(stream, MediaTypeNames.Text.JavaScript, entityTag: new EntityTagHeaderValue(etag));
    }

    private static bool ShouldRedirectToTrailingSlash(HttpContext httpContext, string? documentName, [NotNullWhen(true)] out string? redirectUrl)
    {
        redirectUrl = null;
        // Redirect to the trailing slash if the path does not end with a slash but only when the document name is not provided
        var path = httpContext.Request.Path;
        if (documentName is null && path.HasValue && !path.Value.EndsWith('/'))
        {
            var lastSlashIndex = path.Value.LastIndexOf('/');
            if (lastSlashIndex != -1)
            {
                redirectUrl = $"{path.Value[(lastSlashIndex + 1)..]}/";
            }
        }

        return redirectUrl is not null;
    }
}