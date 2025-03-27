using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.Aspire;

public static class DistributedApplicationBuilderExtensions
{
    public static IResourceBuilder<ScalarResource> AddScalarApiReference(this IDistributedApplicationBuilder builder, Action<ScalarAspireOptions>? configureOptions = null)
    {
        builder.Services.TryAddLifecycleHook<ScalarHook>();
        if (configureOptions is not null)
        {
            builder.Services.Configure(configureOptions);
        }

        var resource = new ScalarResource("scalar");
        return builder
            .AddResource(resource)
            .ExcludeFromManifest()
            .WithInitialState(new CustomResourceSnapshot
            {
                State = "Starting",
                ResourceType = "scalar-api-reference",
                Properties = [],
                CreationTimeStamp = DateTime.Now
            });
    }
}