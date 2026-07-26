using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Scalar.Aws.Lambda;

/// <summary>
/// Extension methods for registering the Scalar API reference in a dependency injection hosted AWS Lambda function.
/// </summary>
public static class ScalarServiceCollectionExtensions
{
    /// <summary>
    /// Registers the Scalar API reference services so that <see cref="IScalarApiReference" /> can be resolved
    /// from an AWS Lambda function.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configureOptions">An optional action to configure <see cref="ScalarOptions" />.</param>
    /// <returns>The same <see cref="IServiceCollection" /> so that calls can be chained.</returns>
    public static IServiceCollection AddScalarApiReference(this IServiceCollection services, Action<ScalarOptions>? configureOptions = null)
    {
        // Always register the options infrastructure so IOptionsSnapshot<ScalarOptions> resolves even when no
        // configureOptions callback is supplied.
        services.Configure<ScalarOptions>(configureOptions ?? (static _ => { }));

        services.TryAddScoped<IScalarApiReference, ScalarApiReference>();
        return services;
    }
}
