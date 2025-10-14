using System.Diagnostics.CodeAnalysis;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarAspireOptions" />.
/// </summary>
public static class ScalarAspireOptionsExtensions
{
    /// <summary>
    /// Controls the bundle URL for the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <param name="bundleUrl">The bundle URL to set.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>Use this option to load the API Reference from a different bundle or local server.</remarks>
    public static ScalarAspireOptions WithBundleUrl(this ScalarAspireOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string bundleUrl)
    {
        options.BundleUrl = bundleUrl;
        return options;
    }

    /// <summary>
    /// Controls the CDN URL for the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <param name="cdnUrl">The CDN URL to set.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>Use this option to load the API Reference from a different CDN or local server.</remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use WithBundleUrl() instead.")]
    public static ScalarAspireOptions WithCdnUrl(this ScalarAspireOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string cdnUrl) => options.WithBundleUrl(cdnUrl);

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