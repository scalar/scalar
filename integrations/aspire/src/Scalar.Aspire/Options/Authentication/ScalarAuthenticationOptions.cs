using System.Text.Json.Serialization;

namespace Scalar.Aspire;

/// <summary>
/// Represents the authentication options for Scalar.
/// </summary>
public sealed class ScalarAuthenticationOptions
{
    /// <summary>
    /// Gets or sets the preferred security schemes.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [JsonPropertyName("preferredSecurityScheme")]
    public IList<string>? PreferredSecuritySchemes { get; set; }

    /// <summary>
    /// Gets or sets the security schemes dictionary.
    /// This dictionary allows configuring multiple security schemes by name,
    /// enabling more flexible authentication configuration for OpenAPI operations.
    /// The key represents the security scheme name as defined in the OpenAPI document,
    /// and the value contains the configuration for that specific security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public IDictionary<string, ScalarSecurityScheme>? SecuritySchemes { get; set; }
}