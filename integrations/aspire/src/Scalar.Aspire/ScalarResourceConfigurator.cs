using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Scalar.Aspire.Helper;

namespace Scalar.Aspire;

internal static class ScalarResourceConfigurator
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static async Task ConfigureScalarResourceAsync(EnvironmentCallbackContext context)
    {
        var resource = context.Resource;
        var serviceProvider = context.ExecutionContext.ServiceProvider;
        var cancellationToken = context.CancellationToken;
        var scalarAnnotations = resource.Annotations.OfType<ScalarAnnotation>();
        var scalarConfigurations = CreateConfigurationsAsync(resource.Name, serviceProvider, scalarAnnotations, cancellationToken);

        var configurations = await scalarConfigurations.ToScalarConfigurationsAsync(cancellationToken).SerializeToJsonAsync(JsonSerializerOptions, cancellationToken);

        // Encode the configurations to Base64 if in publish mode
        if (context.ExecutionContext.IsPublishMode)
        {
            configurations = Convert.ToBase64String(Encoding.UTF8.GetBytes(configurations));
        }
        
        var scalarAspireOptions = serviceProvider.GetRequiredService<IOptionsMonitor<ScalarAspireOptions>>().Get(resource.Name);

        var environmentVariables = context.EnvironmentVariables;
        environmentVariables.Add(ApiReferenceConfig, configurations);
        environmentVariables.Add(CdnUrl, scalarAspireOptions.CdnUrl);
        environmentVariables.Add(AllowSelfSignedCertificates, scalarAspireOptions.AllowSelfSignedCertificates);
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
                await scalarAnnotation.ConfigureOptions.Invoke(scalarAspireOptions, cancellationToken);
            }

            if (scalarAspireOptions.DefaultProxy)
            {
                ConfigureProxyUrl(scalarAspireOptions);
            }

            var endpoints = scalarAnnotation.Resource.Annotations.OfType<EndpointAnnotation>().ToArray();
            if (endpoints.Length == 0)
            {
                throw new InvalidOperationException($"No endpoints found for resource '{resourceName}'. Ensure that the resource has at least one endpoint.");
            }

            var httpAvailable = endpoints.Any(endpoint => endpoint.UriScheme == "http");
            var httpsAvailable = endpoints.Any(endpoint => endpoint.UriScheme == "https");
            if (!httpAvailable && !httpsAvailable)
            {
                throw new InvalidOperationException($"No HTTP or HTTPS endpoints found for resource '{resourceName}'. Ensure that the resource has at least one HTTP or HTTPS endpoint.");
            }

            var shouldUseHttps = (!httpAvailable || scalarAspireOptions.PreferHttpsEndpoint) && httpsAvailable;
            var resourceUrl = GetResourceUrl(resourceName, shouldUseHttps, scalarAspireOptions.DefaultProxy, endpoints);

            ConfigureOpenApiServers(scalarAspireOptions, resourceName, resourceUrl);
            ConfigureOpenApiRoutePattern(scalarAspireOptions, resourceUrl);
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

    private static void ConfigureOpenApiRoutePattern(ScalarOptions scalarOptions, string resourceUrl)
    {
        // Only set the full URL if the OpenAPI route pattern is not a full URL
        if (!RegexHelper.HttpUrlPattern().IsMatch(scalarOptions.OpenApiRoutePattern))
        {
            scalarOptions.OpenApiRoutePattern = $"{resourceUrl}/{scalarOptions.OpenApiRoutePattern.TrimStart('/')}";
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