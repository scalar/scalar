using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the OAuth2 Implicit flow configuration.
/// </summary>
public sealed class ImplicitFlow : OAuthFlow
{
    /// <summary>
    /// Gets or sets the authorization URL to be used for this flow.
    /// </summary>
    public string? AuthorizationUrl { get; set; }

    /// <summary>
    /// Gets or sets the redirect URI for the implicit flow.
    /// </summary>
    [JsonPropertyName("x-scalar-redirect-uri")]
    public string? RedirectUri { get; set; }
}