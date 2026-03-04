using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring Scalar resource builders.
/// </summary>
public static class ResourceBuilderExtensions
{
    /// <summary>
    /// Adds an OpenAPI reference to the Scalar resource from another resource with service discovery.
    /// </summary>
    /// <param name="builder">The Scalar resource builder.</param>
    /// <param name="resourceBuilder">The resource builder that provides the OpenAPI document.</param>
    /// <param name="configureOptions">Optional action to configure <see cref="ScalarOptions"/> for this service.</param>
    /// <returns>The resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> WithApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        Action<ScalarOptions>? configureOptions = null) => builder.WithApiReference(resourceBuilder, (options, _) =>
    {
        configureOptions?.Invoke(options);
        return Task.CompletedTask;
    });


    /// <summary>
    /// Adds an OpenAPI reference to the Scalar resource from another resource with service discovery.
    /// </summary>
    /// <param name="builder">The Scalar resource builder.</param>
    /// <param name="resourceBuilder">The resource builder that provides the OpenAPI document.</param>
    /// <param name="configureOptions">Action to configure <see cref="ScalarOptions"/> for this service asynchronously.</param>
    /// <returns>The resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> WithApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        Func<ScalarOptions, CancellationToken, Task> configureOptions) =>
        builder
            .WithReference(resourceBuilder)
            .WithAnnotation(new ScalarAnnotation(resourceBuilder.Resource, configureOptions));

    /// <summary>
    /// Adds a static OpenAPI document to the Scalar resource for a given service.
    /// Use this overload when the service does not expose a live OpenAPI endpoint.
    /// The file is mounted into the Scalar container and served at <c>/openapi/{filename}</c>.
    /// </summary>
    /// <param name="builder">The Scalar resource builder.</param>
    /// <param name="resourceBuilder">The resource builder for the service. Used to configure the API server URL for the "Try It" feature.</param>
    /// <param name="openApiFile">The local OpenAPI document file to serve.</param>
    /// <param name="configureOptions">Optional action to configure <see cref="ScalarOptions"/> for this document.</param>
    /// <returns>The resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> WithApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        FileInfo openApiFile,
        Action<ScalarOptions>? configureOptions = null) =>
        builder.WithApiReference(resourceBuilder, openApiFile, (options, _) =>
        {
            configureOptions?.Invoke(options);
            return Task.CompletedTask;
        });

    /// <summary>
    /// Adds a static OpenAPI document to the Scalar resource for a given service.
    /// Use this overload when the service does not expose a live OpenAPI endpoint.
    /// The file is mounted into the Scalar container and served at <c>/openapi/{filename}</c>.
    /// </summary>
    /// <param name="builder">The Scalar resource builder.</param>
    /// <param name="resourceBuilder">The resource builder for the service. Used to configure the API server URL for the "Try It" feature.</param>
    /// <param name="openApiFile">The local OpenAPI document file to serve.</param>
    /// <param name="configureOptions">Action to configure <see cref="ScalarOptions"/> for this document asynchronously.</param>
    /// <returns>The resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> WithApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        FileInfo openApiFile,
        Func<ScalarOptions, CancellationToken, Task> configureOptions) =>
        builder
            .WithReference(resourceBuilder)
            .WithBindMount(openApiFile.FullName, $"{StaticFilesEndpoint}/{openApiFile.Name}", isReadOnly: true)
            .WithAnnotation(new ScalarAnnotation(resourceBuilder.Resource, async (options, ct) =>
            {
                // Serve the OpenAPI document from the Scalar container's static file endpoint.
                // ReferenceExpression.Empty resolves to null at startup, which signals to the configurator
                // that no base URL should be prepended — the route pattern is used as-is.
                options.BaseDocumentUrl = ReferenceExpression.Empty;
                options.OpenApiRoutePattern = $"{StaticFilesEndpoint}/{openApiFile.Name}";
                await configureOptions(options, ct);
            }));
}