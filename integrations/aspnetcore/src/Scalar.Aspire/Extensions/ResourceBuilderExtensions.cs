using Aspire.Hosting.ApplicationModel;
using Scalar.AspNetCore;

namespace Scalar.Aspire;

public static class ResourceBuilderExtensions
{
    public static IResourceBuilder<ScalarResource> WithReference(
        this IResourceBuilder<ScalarResource> builder,
        IResourceBuilder<ProjectResource> projectResourceBuilder,
        Action<ScalarApiReferenceOptions>? configureOptions = null) => builder.WithAnnotation(new ScalarAnnotation(projectResourceBuilder.Resource, configureOptions));
}