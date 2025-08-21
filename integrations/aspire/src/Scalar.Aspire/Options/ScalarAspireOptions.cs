namespace Scalar.Aspire;

/// <summary>
/// Represents configuration options specific to Scalar API reference integration with .NET Aspire.
/// Extends <see cref="ScalarOptions"/> with Aspire-specific settings.
/// </summary>
public sealed class ScalarAspireOptions : ScalarOptions
{
    /// <summary>
    /// Gets or sets whether to use the default proxy configuration for API requests.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    /// <remarks>
    /// When enabled, all API requests will be proxied through the Aspire server to avoid CORS issues.
    /// </remarks>
    public bool DefaultProxy { get; set; } = true;

    /// <summary>
    /// Gets or sets the CDN URL for loading Scalar assets.
    /// </summary>
    /// <value>The default value is <c>"standalone.js"</c>.</value>
    /// <remarks>
    /// This URL is used to load the Scalar JavaScript bundle and related assets.
    /// Can be customized to use a different CDN or local assets.
    /// </remarks>
    public string CdnUrl { get; set; } = "standalone.js";

    /// <summary>
    /// Gets or sets whether to allow self-signed certificates for HTTPS connections.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>
    /// When enabled, the scalar proxy will accept self-signed certificates.
    /// This should only be used in development environments and never in production.
    /// </remarks>
    public bool AllowSelfSignedCertificates { get; set; }
}