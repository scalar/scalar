using System.Runtime.CompilerServices;
using System.Text;
using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Scalar.Aspire.Helper;

namespace Scalar.Aspire;

internal static class ScalarResourceConfigurator
{
    public static async Task ConfigureScalarResourceAsync(EnvironmentCallbackContext context)
    {
        var resource = context.Resource;
        var serviceProvider = context.ExecutionContext.ServiceProvider;
        var cancellationToken = context.CancellationToken;
        var scalarAnnotations = resource.Annotations.OfType<ScalarAnnotation>();
        var scalarConfigurations = CreateConfigurationsAsync(resource.Name, serviceProvider, scalarAnnotations, cancellationToken);

        var configurations = await scalarConfigurations.ToScalarConfigurationsAsync(cancellationToken).SerializeToJsonAsync(cancellationToken);

        // Encode the configurations to Base64 if in publish mode
        if (context.ExecutionContext.IsPublishMode)
        {
            configurations = Convert.ToBase64String(Encoding.UTF8.GetBytes(configurations));
        }

        var scalarAspireOptions = serviceProvider.GetRequiredService<IOptionsMonitor<ScalarAspireOptions>>().Get(resource.Name);

        var environmentVariables = context.EnvironmentVariables;
        environmentVariables.Add(ApiReferenceConfig, configurations);
        environmentVariables.Add(CdnUrl, scalarAspireOptions.BundleUrl);
        environmentVariables.Add(AllowSelfSignedCertificates, scalarAspireOptions.AllowSelfSignedCertificates);
        environmentVariables.Add(ForwardOriginalHostHeader, scalarAspireOptions.ForwardOriginalHostHeader);
        environmentVariables.Add(DefaultProxy, scalarAspireOptions.DefaultProxy);
    }

    private static async IAsyncEnumerable<ScalarOptions> CreateConfigurationsAsync(string scalarResourceName, IServiceProvider serviceProvider, IEnumerable<ScalarAnnotation> annotations, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        foreach (var scalarAnnotation in annotations)
        {
            var resourceName = scalarAnnotation.Resource.Name;

            using var scope = serviceProvider.CreateScope();
            var scalarAspireOptions = scope.ServiceProvider.GetRequiredService<IOptionsSnapshot<ScalarAspireOptions>>().Get(scalarResourceName);
            if (scalarAnnotation.ConfigureOptions is not null)
            {
                // The callback also configures the ResourceBaseUrlExpression captured in the annotation so that
                // DefaultProxy and PreferHttpsEndpoint are resolved before the expression is evaluated below.
                await scalarAnnotation.ConfigureOptions.Invoke(scalarAspireOptions, cancellationToken);
            }

            if (scalarAspireOptions.DefaultProxy)
            {
                ConfigureProxyUrl(scalarAspireOptions);
            }

            // Endpoint discovery is still used to auto-configure the servers array for the "Try It" feature.
            // The base URL for the OpenAPI document route pattern comes exclusively from annotation.BaseDocumentUrl
            // (set by WithApiReference) — no fallback discovery is performed for that purpose.
            var endpoints = scalarAnnotation.Resource.Annotations.OfType<EndpointAnnotation>().ToArray();
            var httpAvailable = endpoints.Any(endpoint => endpoint.UriScheme == "http");
            var httpsAvailable = endpoints.Any(endpoint => endpoint.UriScheme == "https");
            var shouldUseHttps = (!httpAvailable || scalarAspireOptions.PreferHttpsEndpoint) && httpsAvailable;
            var resourceUrl = GetResourceUrl(resourceName, shouldUseHttps, scalarAspireOptions.DefaultProxy, endpoints);

            ConfigureOpenApiServers(scalarAspireOptions, resourceName, resourceUrl);
            await ConfigureOpenApiRoutePatternAsync(scalarAspireOptions, scalarAnnotation.BaseDocumentUrl, cancellationToken);
            ConfigureDocuments(scalarAspireOptions, resourceName);

            yield return scalarAspireOptions;
        }
    }

    private static void ConfigureOpenApiServers(ScalarOptions scalarOptions, string resourceName, string resourceUrl)
    {
        // Only set OpenAPI servers if not already assigned
        var server = new ScalarServer(resourceUrl, resourceName);
        scalarOptions.Servers ??= [server];
    }

    private static async Task ConfigureOpenApiRoutePatternAsync(ScalarOptions scalarOptions, ReferenceExpression? annotationBaseDocumentUrl, CancellationToken cancellationToken)
    {
        // Only set the full URL if the OpenAPI route pattern is not already a full URL
        if (RegexHelper.HttpUrlPattern().IsMatch(scalarOptions.OpenApiRoutePattern))
        {
            return;
        }

        // Priority: user's explicit scalarOptions.BaseDocumentUrl > annotation's BaseDocumentUrl.
        // annotation.BaseDocumentUrl is always set by WithApiReference — the configurator never sets it.
        // A null/empty resolved value means "use the pattern as-is" (e.g. ReferenceExpression.Empty
        // for a static file served from the Scalar container).
        var baseDocumentUrl = scalarOptions.BaseDocumentUrl ?? annotationBaseDocumentUrl;
        if (baseDocumentUrl is null)
        {
            return;
        }

        var baseUrl = await baseDocumentUrl.GetValueAsync(cancellationToken);
        if (!string.IsNullOrEmpty(baseUrl))
        {
            scalarOptions.OpenApiRoutePattern = $"{baseUrl.TrimEnd('/')}/{scalarOptions.OpenApiRoutePattern.TrimStart('/')}";
        }
    }

    private static void ConfigureProxyUrl(ScalarOptions scalarOptions)
    {
        // Only set the proxy URL if not already assigned
        scalarOptions.ProxyUrl ??= ProxyEndpoint;
    }

    private static void ConfigureDocuments(ScalarOptions scalarOptions, string resourceName)
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
            var title = document.Title ?? document.Name;

            // Prefix the title with the resource name
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

    private static string GetResourceUrl(string resourceName, bool useHttps, bool useProxy, EndpointAnnotation[] endpoints)
    {
        var scheme = useHttps ? "https" : "http";

        if (useProxy)
        {
            return $"{scheme}://{resourceName}";
        }

        var endpoint = endpoints.FirstOrDefault(e => e.UriScheme == scheme) ?? throw new InvalidOperationException($"No endpoint found for resource '{resourceName}' with URI scheme '{scheme}'.");
        return $"{scheme}://{endpoint.TargetHost}:{endpoint.TargetPort ?? endpoint.Port}";
    }
}