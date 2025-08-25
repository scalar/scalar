using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the OAuth2 Resource Owner Password flow configuration.
/// </summary>
public sealed class PasswordFlow : OAuthFlow
{
    /// <summary>
    /// Gets or sets the token URL to be used for this flow.
    /// </summary>
    public string? TokenUrl { get; set; }

    /// <summary>
    /// Gets or sets the client secret used for authentication.
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Gets or sets the username used for authentication.
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password used for authentication.
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the location where authentication credentials should be placed in HTTP requests.
    /// </summary>
    [JsonPropertyName("x-scalar-credentials-location")]
    public CredentialsLocation? CredentialsLocation { get; set; }
}