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

    /// <summary>
    /// Adds a code sample to the API endpoint.
    /// </summary>
    /// <typeparam name="TBuilder">The type of <see cref="IEndpointConventionBuilder" />.</typeparam>
    /// <param name="builder">The endpoint convention builder.</param>
    /// <param name="codeSample">The code sample to add.</param>
    /// <param name="language">The language of the code sample.</param>
    /// <param name="label">A label for the code sample.</param>
    public static TBuilder CodeSample<TBuilder>(this TBuilder builder, string codeSample, ScalarTarget? language = null, string? label = null) where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new CodeSampleAttribute(codeSample, language, label));
        return builder;
    }

    /// <summary>
    /// Adds a badge to the API endpoint.
    /// </summary>
    /// <typeparam name="TBuilder">The type of <see cref="IEndpointConventionBuilder" />.</typeparam>
    /// <param name="builder">The endpoint convention builder.</param>
    /// <param name="name">The text that displays in the badge.</param>
    /// <param name="position">The position of the badge in relation to the header.</param>
    /// <param name="color">The color of the badge.</param>
    public static TBuilder WithBadge<TBuilder>(this TBuilder builder, string name, BadgePosition? position = null, string? color = null) where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new BadgeAttribute(name, position, color));
        return builder;
    }

    private static TBuilder WithStability<TBuilder>(this TBuilder builder, Stability stability) where TBuilder : IEndpointConventionBuilder
    {
        builder.WithMetadata(new StabilityAttribute(stability));
        return builder;
    }
}