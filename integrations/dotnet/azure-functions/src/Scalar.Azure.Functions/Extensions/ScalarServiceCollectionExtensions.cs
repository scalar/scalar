using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Scalar.Azure.Functions;

/// <summary>
/// Extension methods for registering the Scalar API reference in an Azure Functions application.
/// </summary>
public static class ScalarServiceCollectionExtensions
{
    /// <summary>
    /// Registers the Scalar API reference services so that <see cref="IScalarApiReference" /> can be resolved
    /// from an HTTP-triggered function.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configureOptions">An optional action to configure <see cref="ScalarOptions" />.</param>
    /// <returns>The same <see cref="IServiceCollection" /> so that calls can be chained.</returns>
    public static IServiceCollection AddScalarApiReference(this IServiceCollection services, Action<ScalarOptions>? configureOptions = null)
    {
        if (configureOptions is not null)
        {
            services.Configure(configureOptions);
        }

        services.TryAddScoped<IScalarApiReference, ScalarApiReference>();
        return services;
    }
}
