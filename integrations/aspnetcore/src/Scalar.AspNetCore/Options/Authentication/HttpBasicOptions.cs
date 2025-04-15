namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for HTTP basic authentication.
/// </summary>
[Obsolete("This class is obsolete and will be removed in a future release. Use AddHttpBasicAuthentication with ScalarHttpSecurityScheme instead.")]
public sealed class HttpBasicOptions
{
    /// <summary>
    /// Gets or sets the username used for HTTP basic authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password used for HTTP basic authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? Password { get; set; }
}