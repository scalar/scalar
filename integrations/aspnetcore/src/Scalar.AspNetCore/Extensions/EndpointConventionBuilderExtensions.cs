using Microsoft.AspNetCore.Builder;

namespace Scalar.AspNetCore;

/// <summary>
/// Provides extension methods for <see cref="IEndpointConventionBuilder" />.
/// </summary>
public static class EndpointConventionBuilderExtensions
{
    /// <summary>
    /// Excludes the endpoint from the Scalar API reference.
    /// </summary>
    /// <typeparam name="TBuilder">The type of <see cref="IEndpointConventionBuilder" />.</typeparam>
    /// <param name="builder">The endpoint convention builder.</param>
    public static TBuilder ExcludeFromApiReference<TBuilder>(this TBuilder builder) where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new ExcludeFromApiReferenceAttribute());
        return builder;
    }

    /// <summary>
    /// Marks an API endpoint as stable.
    /// </summary>
    /// <typeparam name="TBuilder">The type of <see cref="IEndpointConventionBuilder" />.</typeparam>
    /// <param name="builder">The endpoint convention builder.</param>
    public static TBuilder Stable<TBuilder>(this TBuilder builder) where TBuilder : IEndpointConventionBuilder => builder.WithStability(Stability.Stable);

    /// <summary>
    /// Marks an API endpoint as experimental, indicating it may change without notice.
    /// </summary>
    /// <typeparam name="TBuilder">The type of <see cref="IEndpointConventionBuilder" />.</typeparam>
    /// <param name="builder">The endpoint convention builder.</param>
    public static TBuilder Experimental<TBuilder>(this TBuilder builder) where TBuilder : IEndpointConventionBuilder => builder.WithStability(Stability.Experimental);

    /// <summary>
    /// Marks an API endpoint as deprecated, indicating it may be removed in future versions.
    /// </summary>
    /// <typeparam name="TBuilder">The type of <see cref="IEndpointConventionBuilder" />.</typeparam>
    /// <param name="builder">The endpoint convention builder.</param>
    public static TBuilder Deprecated<TBuilder>(this TBuilder builder) where TBuilder : IEndpointConventionBuilder => builder.WithStability(Stability.Deprecated);

    private static TBuilder WithStability<TBuilder>(this TBuilder builder, Stability stability) where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new StabilityAttribute(stability));
        return builder;
    }
}