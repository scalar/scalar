namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarAspireOptions" />.
/// </summary>
public static class ScalarAspireOptionsExtensions
{
    /// <summary>
    /// Sets the CDN URL for the Scalar API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <param name="cdnUrl">The CDN URL to set.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    public static ScalarAspireOptions WithCdnUrl(this ScalarAspireOptions options, string cdnUrl)
    {
        options.CdnUrl = cdnUrl;
        return options;
    }

    /// <summary>
    /// Disables the default proxy configuration.
    /// By default, all requests will be proxied to prevent CORS issues.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    public static ScalarAspireOptions DisableDefaultProxy(this ScalarAspireOptions options)
    {
        options.DefaultProxy = false;
        return options;
    }
}