namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static partial class ScalarOptionsExtensions
{

    /// <summary>
    /// Sets whether HTTPS should be preferred over HTTP when both are available.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    public static TOptions PreferHttpsEndpoint<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.PreferHttpsEndpoint = true;
        return options;
    }
}