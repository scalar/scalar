using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

public static class ResourceBuilderExtensions
{
    public static IResourceBuilder<ScalarResource> WithOpenApiReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<IResourceWithServiceDiscovery> resourceBuilder,
        Action<ScalarOptions>? configureOptions = null) =>
        builder
            .WithReference(resourceBuilder)
            .WithAnnotation(new ScalarAnnotation(resourceBuilder.Resource, configureOptions));
}