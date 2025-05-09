using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Base class containing common properties for all OAuth2 flows.
/// </summary>
public abstract class OAuthFlow
{
    /// <summary>
    /// Gets or sets the URL to be used for obtaining refresh tokens.
    /// </summary>
    public string? RefreshUrl { get; set; }

    /// <summary>
    /// Gets or sets the preselected scopes for the request.
    /// </summary>
    public IEnumerable<string>? SelectedScopes { get; set; }

    /// <summary>
    /// Gets or sets the client ID associated with the OAuth flow.
    /// </summary>
    [JsonPropertyName("x-scalar-client-id")]
    public string? ClientId { get; set; }

    /// <summary>
    /// Gets or sets the authentication token.
    /// </summary>
    public string? Token { get; set; }
}