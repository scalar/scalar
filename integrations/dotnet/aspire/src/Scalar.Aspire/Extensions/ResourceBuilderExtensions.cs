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
        Func<ScalarOptions, CancellationToken, Task> configureOptions)
    {
        // Create the expression at build time so the annotation owns it from the start.
        // The expression is configured lazily (inside the callback below) once options are known.
        var endpointExpression = new ResourceBaseUrlExpression(resourceBuilder.Resource);
        var baseDocumentUrl = ReferenceExpression.Create($"{endpointExpression}");

        return builder
            .WithReference(resourceBuilder)
            .WithAnnotation(new ScalarAnnotation(resourceBuilder.Resource, async (options, ct) =>
            {
                await configureOptions(options, ct);

                // Configure after the user's callback so DefaultProxy and PreferHttpsEndpoint are final.
                endpointExpression.Configure(
                    ((ScalarAspireOptions)options).DefaultProxy,
                    options.PreferHttpsEndpoint);
            }, BaseDocumentUrl: baseDocumentUrl));
    }

    /// <summary>
    /// Adds a static OpenAPI document to the Scalar resource for a given service.
    /// Use this overload when the service does not expose a live OpenAPI endpoint.
    /// The file is mounted into the Scalar container and served at <c>/openapi/{folderPath}/{filename}</c>.
    /// </summary>
    /// <param name="builder">The Scalar resource builder.</param>
    /// <param name="resourceBuilder">The resource builder for the service. Used to configure the API server URL for the "Try It" feature.</param>
    /// <param name="openApiFile">The local OpenAPI document file to serve.</param>
    /// <param name="folderPath">
    /// Optional sub-folder path (relative to <c>/openapi</c>) where the file is mounted inside the Scalar container.
    /// When provided, the file is served at <c>/openapi/{folderPath}/{filename}</c>.
    /// When <see langword="null"/> (default), the resource name (<see cref="IResource.Name"/>) is used as the folder,
    /// serving the file at <c>/openapi/{resourceName}/{filename}</c>.
    /// Use an explicit value to override the default folder or to avoid name collisions.
    /// </param>
    /// <param name="configureOptions">Optional action to configure <see cref="ScalarOptions"/> for this document.</param>
    /// <returns>The resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> WithApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        FileInfo openApiFile,
        string? folderPath = null,
        Action<ScalarOptions>? configureOptions = null) =>
        builder.WithApiReference(resourceBuilder, openApiFile, folderPath, (options, _) =>
        {
            configureOptions?.Invoke(options);
            return Task.CompletedTask;
        });

    /// <summary>
    /// Adds a static OpenAPI document to the Scalar resource for a given service.
    /// Use this overload when the service does not expose a live OpenAPI endpoint.
    /// The file is mounted into the Scalar container and served at <c>/openapi/{folderPath}/{filename}</c>.
    /// </summary>
    /// <param name="builder">The Scalar resource builder.</param>
    /// <param name="resourceBuilder">The resource builder for the service. Used to configure the API server URL for the "Try It" feature.</param>
    /// <param name="openApiFile">The local OpenAPI document file to serve.</param>
    /// <param name="folderPath">
    /// Optional sub-folder path (relative to <c>/openapi</c>) where the file is mounted inside the Scalar container.
    /// When provided, the file is served at <c>/openapi/{folderPath}/{filename}</c>.
    /// When <see langword="null"/> (default), the resource name (<see cref="IResource.Name"/>) is used as the folder,
    /// serving the file at <c>/openapi/{resourceName}/{filename}</c>.
    /// Use an explicit value to override the default folder or to avoid name collisions.
    /// </param>
    /// <param name="configureOptions">Action to configure <see cref="ScalarOptions"/> for this document asynchronously.</param>
    /// <returns>The resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> WithApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        FileInfo openApiFile,
        string? folderPath,
        Func<ScalarOptions, CancellationToken, Task> configureOptions)
    {
        // The OpenAPI document is served from the Scalar container's static file endpoint,
        // so BaseDocumentUrl = Empty signals to the configurator to use the route pattern as-is.
        // A separate endpointExpression is still needed inside the callback so that DefaultProxy
        // and PreferHttpsEndpoint are picked up for any downstream use (e.g., servers).
        var endpointExpression = new ResourceBaseUrlExpression(resourceBuilder.Resource);
        var folder = string.IsNullOrEmpty(folderPath) ? resourceBuilder.Resource.Name : folderPath.Trim('/');
        var containerPath = $"{StaticFilesEndpoint}/{folder}/{openApiFile.Name}";

        return builder
            .WithReference(resourceBuilder)
            .WithBindMount(openApiFile.FullName, containerPath, isReadOnly: true)
            .WithAnnotation(new ScalarAnnotation(resourceBuilder.Resource, async (options, ct) =>
            {
                options.OpenApiRoutePattern = containerPath;
                await configureOptions(options, ct);

                // Configure after the user's callback so DefaultProxy and PreferHttpsEndpoint are final.
                endpointExpression.Configure(
                    ((ScalarAspireOptions)options).DefaultProxy,
                    options.PreferHttpsEndpoint);
            }, BaseDocumentUrl: ReferenceExpression.Empty));
    }
}