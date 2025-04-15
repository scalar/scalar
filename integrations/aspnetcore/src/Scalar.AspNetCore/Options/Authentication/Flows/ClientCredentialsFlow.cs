namespace Scalar.AspNetCore;

/// <summary>
/// Represents the OAuth2 Client Credentials flow configuration.
/// </summary>
public sealed class ClientCredentialsFlow : OAuthFlow
{
    /// <summary>
    /// Gets or sets the token URL to be used for this flow.
    /// </summary>
    public string? TokenUrl { get; set; }

    /// <summary>
    /// Gets or sets the client secret used for authentication.
    /// </summary>
    public string? ClientSecret { get; set; }
}