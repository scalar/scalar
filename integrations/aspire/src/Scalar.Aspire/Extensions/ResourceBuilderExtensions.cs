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
}