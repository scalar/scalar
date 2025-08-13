using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring Scalar API reference in Aspire applications.
/// </summary>
public static class DistributedApplicationBuilderExtensions
{
    /// <summary>
    /// Adds a Scalar API reference resource to the distributed application with default settings.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="configureOptions">Optional action to configure <see cref="ScalarAspireOptions"/>.</param>
    /// <returns>A resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> AddScalarApiReference(this IDistributedApplicationBuilder builder, Action<ScalarAspireOptions>? configureOptions = null)
        => builder.AddScalarApiReference(DefaultResourceName, null, configureOptions);

    /// <summary>
    /// Adds a Scalar API reference resource to the distributed application with a specified name.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="name">The name of the Scalar resource.</param>
    /// <param name="configureOptions">Optional action to configure <see cref="ScalarAspireOptions"/>.</param>
    /// <returns>A resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> AddScalarApiReference(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        Action<ScalarAspireOptions> configureOptions) => builder.AddScalarApiReference(name, null, configureOptions);

    /// <summary>
    /// Adds a Scalar API reference resource to the distributed application with detailed configuration.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="name">The name of the Scalar resource.</param>
    /// <param name="port">Optional port number for the Scalar service.</param>
    /// <param name="configureOptions">Optional action to configure <see cref="ScalarAspireOptions"/>.</param>
    /// <returns>A resource builder for the <see cref="ScalarResource"/>.</returns>
    public static IResourceBuilder<ScalarResource> AddScalarApiReference(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        int? port = null,
        Action<ScalarAspireOptions>? configureOptions = null)
    {
        if (configureOptions is not null)
        {
            builder.Services.Configure(name, configureOptions);
        }

        var resource = new ScalarResource(name);
        return builder
            .AddResource(resource)
            .WithImage(Image)
            .WithImageTag(ImageTag)
            .WithHttpEndpoint(port, DefaultPort, DefaultEndpointName)
            .WithUrlForEndpoint(DefaultEndpointName, x =>
            {
                x.DisplayText = "Scalar API Reference";
                x.Url = ApiReferenceEndpoint;
            })
            .WithHttpHealthCheck(HealthCheckEndpoint)
            .WithEnvironment(async context =>
            {
                await ScalarResourceConfigurator.ConfigureScalarResourceAsync(context);
            });
    }
}