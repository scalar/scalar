using Microsoft.Extensions.DependencyInjection;
using Scalar.AspNetCore.Swashbuckle;

namespace Scalar.AspNetCore;

/// <summary>
/// Extension methods for <see cref="IServiceCollection" /> to configure Scalar services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds Scalar services to the specified <see cref="IServiceCollection" /> with configuration options.
    /// This method registers the <see cref="IScalarDocumentProvider" /> implementation
    /// that enables loading OpenAPI document content directly from the service container.
    /// </summary>
    /// <param name="services">The <see cref="IServiceCollection" /> to add services to.</param>
    /// <param name="configureOptions">An action to configure the <see cref="ScalarSwashbuckleOptions" />.</param>
    /// <returns>The <see cref="IServiceCollection" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When registered, the <see cref="IScalarDocumentProvider" /> will be used to fetch
    /// document content directly instead of relying on URL-based document loading.
    /// This is particularly useful when you want to embed OpenAPI documents directly
    /// in the Scalar configuration rather than serving them via separate endpoints.
    /// </remarks>
    public static IServiceCollection AddScalarServices(this IServiceCollection services, Action<ScalarSwashbuckleOptions>? configureOptions = null)
    {
        if (configureOptions is not null)
        {
            services.Configure(configureOptions);
        }

        services.AddSingleton<IScalarDocumentProvider, ScalarDocumentProvider>();
        return services;
    }
}