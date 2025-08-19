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
    /// Disables the default proxy.
    /// By default, all requests will be proxied to prevent CORS issues.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    public static ScalarAspireOptions DisableDefaultProxy(this ScalarAspireOptions options)
    {
        options.DefaultProxy = false;
        return options;
    }

    /// <summary>
    /// Allows self-signed certificates for HTTPS connections.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When enabled, the scalar proxy will accept self-signed certificates.
    /// This should only be used in development environments and never in production.
    /// </remarks>
    public static ScalarAspireOptions AllowSelfSignedCertificates(this ScalarAspireOptions options)
    {
        options.AllowSelfSignedCertificates = true;
        return options;
    }
    
}