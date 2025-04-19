using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents a security scheme that uses OAuth 2.0 authentication.
/// </summary>
/// <remarks>
/// This scheme is used to prefill or overwrite OAuth 2.0 authentication values
/// when making API requests. It specifies flows and default scopes to be used
/// during the authorization process.
/// </remarks>
public sealed class ScalarOAuth2SecurityScheme : ScalarSecurityScheme
{
    /// <summary>
    /// Gets or sets the OAuth 2.0 flows configuration for this security scheme.
    /// </summary>
    /// <remarks>
    /// Contains configuration for different OAuth flow types like implicit, password,
    /// client credentials, or authorization code. The configured flows determine how
    /// the authentication process is handled.
    /// </remarks>
    public ScalarFlows? Flows { get; set; }

    /// <summary>
    /// Gets or sets the default OAuth 2.0 scopes to request during authorization.
    /// </summary>
    /// <remarks>
    /// These scopes are prefilled or used to overwrite the requested scopes when initiating
    /// the OAuth flow.
    /// </remarks>
    [JsonPropertyName("x-default-scopes")]
    public IEnumerable<string>? DefaultScopes { get; set; }
}