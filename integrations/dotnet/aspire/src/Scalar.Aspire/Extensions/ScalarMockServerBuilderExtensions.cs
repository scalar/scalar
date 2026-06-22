using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for adding and configuring a Scalar Mock Server in Aspire applications.
/// </summary>
public static class ScalarMockServerBuilderExtensions
{
    /// <summary>
    /// Adds a Scalar Mock Server resource to the distributed application with the default name.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="configureOptions">Action to configure the document source via <see cref="ScalarMockServerOptions" />.</param>
    /// <returns>A resource builder for the <see cref="ScalarMockServerResource" />.</returns>
    public static IResourceBuilder<ScalarMockServerResource> AddScalarMockServer(
        this IDistributedApplicationBuilder builder,
        Action<ScalarMockServerOptions>? configureOptions = null)
        => builder.AddScalarMockServer(MockServerDefaultResourceName, null, configureOptions);

    /// <summary>
    /// Adds a Scalar Mock Server resource to the distributed application with a specified name.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="name">The name of the mock server resource.</param>
    /// <param name="configureOptions">Action to configure the document source via <see cref="ScalarMockServerOptions" />.</param>
    /// <returns>A resource builder for the <see cref="ScalarMockServerResource" />.</returns>
    public static IResourceBuilder<ScalarMockServerResource> AddScalarMockServer(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        Action<ScalarMockServerOptions> configureOptions)
        => builder.AddScalarMockServer(name, null, configureOptions);

    /// <summary>
    /// Adds a Scalar Mock Server resource to the distributed application with detailed configuration.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="name">The name of the mock server resource.</param>
    /// <param name="port">Optional host port to expose the mock server on.</param>
    /// <param name="configureOptions">Action to configure the document source via <see cref="ScalarMockServerOptions" />.</param>
    /// <returns>A resource builder for the <see cref="ScalarMockServerResource" />.</returns>
    public static IResourceBuilder<ScalarMockServerResource> AddScalarMockServer(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        int? port = null,
        Action<ScalarMockServerOptions>? configureOptions = null)
    {
        var resource = new ScalarMockServerResource(name);
        configureOptions?.Invoke(resource.Options);

        // Mirror the API reference resource: drop OTLP exporter annotations so Aspire's
        // universal container tunnel bootstrap does not block on telemetry endpoint allocation.
        // The mock server does not require OTLP endpoint references to run.
        builder.Eventing.Subscribe<BeforeStartEvent>((_, _) =>
        {
            RemoveOtlpExporterAnnotations(resource);
            return Task.CompletedTask;
        });

        return builder
            .AddResource(resource)
            .WithImage(MockServerImage)
            .WithImageTag(MockServerImageTag)
            .WithHttpEndpoint(port, MockServerDefaultPort, DefaultEndpointName)
            .WithUrlForEndpoint(DefaultEndpointName, x =>
            {
                x.DisplayText = "Scalar Mock Server";
                x.Url = MockServerOpenApiEndpoint;
            })
            .WithHttpHealthCheck(MockServerOpenApiEndpoint)
            .WithEnvironment(context => ConfigureEnvironment(resource, context));
    }

    /// <summary>
    /// Configures the mock server to derive its OpenAPI document from another resource's endpoint.
    /// </summary>
    /// <param name="builder">The mock server resource builder.</param>
    /// <param name="resourceBuilder">The resource that exposes the OpenAPI document.</param>
    /// <param name="routePattern">The route the OpenAPI document is served at on the referenced resource.</param>
    /// <param name="endpointName">The endpoint name to resolve on the referenced resource. Defaults to the HTTP endpoint.</param>
    /// <returns>The mock server resource builder.</returns>
    public static IResourceBuilder<ScalarMockServerResource> WithDocumentFrom(
        this IResourceBuilder<ScalarMockServerResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        string routePattern = MockServerDefaultDocumentRoute,
        string? endpointName = null)
    {
        var endpoint = resourceBuilder.GetEndpoint(endpointName ?? DefaultEndpointName);
        var expression = ReferenceExpression.Create($"{endpoint}/{routePattern.TrimStart('/')}");

        builder.Resource.Options.WithDocumentExpression(expression);

        // Reference the target so service discovery resolves the endpoint inside the container.
        return builder.WithReference(resourceBuilder);
    }

    internal static void ConfigureEnvironment(ScalarMockServerResource resource, EnvironmentCallbackContext context)
    {
        var options = resource.Options;

        if (!options.HasDocument)
        {
            throw new InvalidOperationException(
                $"No OpenAPI document configured for mock server '{resource.Name}'. Configure a document source using " +
                $"{nameof(ScalarMockServerOptions.WithDocument)}, {nameof(ScalarMockServerOptions.WithDocumentFile)}, " +
                $"{nameof(ScalarMockServerOptions.WithDocumentUrl)}, or {nameof(WithDocumentFrom)}.");
        }

        var environmentVariables = context.EnvironmentVariables;

        if (options.DocumentContent is not null)
        {
            environmentVariables.Add(OpenApiDocument, options.DocumentContent);
        }
        else if (options.DocumentUrlExpression is not null)
        {
            environmentVariables.Add(OpenApiDocumentUrl, options.DocumentUrlExpression);
        }
        else if (options.DocumentUrl is not null)
        {
            environmentVariables.Add(OpenApiDocumentUrl, options.DocumentUrl);
        }
    }

    private static void RemoveOtlpExporterAnnotations(ScalarMockServerResource resource)
    {
        var otlpExporterAnnotations = resource.Annotations.OfType<OtlpExporterAnnotation>().ToArray();
        foreach (var annotation in otlpExporterAnnotations)
        {
            resource.Annotations.Remove(annotation);
        }
    }
}
