namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for OAuth2 authentication.
/// </summary>
public sealed class OAuth2Options
{
    /// <summary>
    /// Gets or sets the client ID for OAuth2 authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? ClientId { get; set; }

    /// <summary>
    /// Gets or sets the scopes for OAuth2 authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public IEnumerable<string>? Scopes { get; set; }
}