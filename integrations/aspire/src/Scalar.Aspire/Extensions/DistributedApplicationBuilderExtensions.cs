using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.Aspire;

public static class DistributedApplicationBuilderExtensions
{
    public static IResourceBuilder<ScalarResource> AddScalarApiReference(this IDistributedApplicationBuilder builder, Action<ScalarAspireOptions>? configureOptions = null)
        => builder.AddScalarApiReference(DefaultResourceName, null, configureOptions);

    public static IResourceBuilder<ScalarResource> AddScalarApiReference(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        Action<ScalarOptions> configureOptions) => builder.AddScalarApiReference(name, null, configureOptions);

    public static IResourceBuilder<ScalarResource> AddScalarApiReference(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        int? port = null,
        Action<ScalarAspireOptions>? configureOptions = null)
    {
        if (configureOptions is not null)
        {
            builder.Services.Configure(configureOptions);
        }

        builder.Services.TryAddLifecycleHook<ScalarHook>();

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
            .ExcludeFromManifest();
    }
}