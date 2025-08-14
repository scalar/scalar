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
        var scalarConfigurations = CreateConfigurationsAsync(serviceProvider, scalarAnnotations, cancellationToken);

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
        if (scalarAspireOptions.DefaultProxy)
        {
            environmentVariables.Add(DefaultProxy, "true");
        }
    }

    private static async IAsyncEnumerable<ScalarOptions> CreateConfigurationsAsync(IServiceProvider serviceProvider, IEnumerable<ScalarAnnotation> annotations, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        foreach (var scalarAnnotation in annotations)
        {
            var resourceName = scalarAnnotation.Resource.Name;

            using var scope = serviceProvider.CreateScope();
            var scalarAspireOptions = scope.ServiceProvider.GetRequiredService<IOptionsSnapshot<ScalarAspireOptions>>().Get(resourceName);
            if (scalarAnnotation.ConfigureOptions is not null)
            {
                await scalarAnnotation.ConfigureOptions.Invoke(scalarAspireOptions, cancellationToken);
            }

            if (scalarAspireOptions.DefaultProxy)
            {
                ConfigureProxyUrl(scalarAspireOptions);
            }

            ConfigureOpenApiServers(scalarAspireOptions, resourceName);
            ConfigureOpenApiRoutePattern(scalarAspireOptions, resourceName);
            ConfigureDocuments(scalarAspireOptions, resourceName);

            yield return scalarAspireOptions;
        }
    }

    private static void ConfigureOpenApiServers(ScalarOptions scalarOptions, string resourceName)
    {
        var resourceUrl = GetResourceUrl(resourceName);
        // Only set OpenAPI servers if not already assigned
        var server = new ScalarServer(resourceUrl, resourceName);
        scalarOptions.Servers ??= [server];
    }

    private static void ConfigureOpenApiRoutePattern(ScalarOptions scalarOptions, string resourceName)
    {
        // Only set the full URL if the OpenAPI route pattern is not a full URL
        if (!RegexHelper.HttpUrlPattern().IsMatch(scalarOptions.OpenApiRoutePattern))
        {
            var resourceUrl = GetResourceUrl(resourceName);
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

    private static string GetResourceUrl(string resourceName) =>
        // Let's make the protocol/endpoint name configurable in the future
        $"http://{resourceName}";
}