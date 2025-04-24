using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the OAuth2 Authorization Code flow configuration.
/// </summary>
public sealed class AuthorizationCodeFlow : OAuthFlow
{
    /// <summary>
    /// Gets or sets the authorization URL to be used for this flow.
    /// </summary>
    public string? AuthorizationUrl { get; set; }

    /// <summary>
    /// Gets or sets the token URL to be used for this flow.
    /// </summary>
    public string? TokenUrl { get; set; }

    /// <summary>
    /// Gets or sets the client secret used for authentication.
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Gets or sets whether to use PKCE (Proof Key for Code Exchange) for the authorization code flow.
    /// </summary>
    [JsonPropertyName("x-usePkce")]
    [JsonConverter(typeof(PkceJsonConverter))]
    public Pkce? Pkce { get; set; }

    /// <summary>
    /// Gets or sets the redirect URI for the authorization code flow.
    /// </summary>
    [JsonPropertyName("x-scalar-redirect-uri")]
    public string? RedirectUri { get; set; }
}