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

    /// <summary>
    /// Gets or sets additional query parameters that should be included in the auth request.
    /// </summary>
    [JsonPropertyName("x-scalar-security-query")]
    public IDictionary<string, string>? AdditionalQueryParameters { get; set; }
    
    /// <summary>
    /// Gets or sets additional body parameters that should be included in the token request.
    /// </summary>
    [JsonPropertyName("x-scalar-security-body")]
    public IDictionary<string, string>? AdditionalBodyParameters { get; set; }

    /// <summary>
    /// Gets or sets the name of the token used in the OAuth flow.
    /// </summary>
    [JsonPropertyName("x-tokenName")]
    public string? TokenName { get; set; }
}