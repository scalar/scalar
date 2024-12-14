namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for HTTP basic authentication.
/// </summary>
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