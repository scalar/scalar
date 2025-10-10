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
    /// Controls the bundle URL for the API Reference.
    /// </summary>
    /// <remarks>Use this option to load the API Reference from a different bundle or local server.</remarks>
    public string BundleUrl { get; set; } = "scalar.js";

    /// <summary>
    /// Controls the CDN URL for the API Reference.
    /// </summary>
    /// <remarks>Use this option to load the API Reference from a different CDN or local server.</remarks>
    [Obsolete("This property is obsolete and will be removed in a future release. Please use BundleUrl instead.")]
    public string CdnUrl
    {
        get => BundleUrl;
        set => BundleUrl = value;
    }

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