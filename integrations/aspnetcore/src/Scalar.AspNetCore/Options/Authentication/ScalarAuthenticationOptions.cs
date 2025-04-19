namespace Scalar.AspNetCore;

/// <summary>
/// Represents the authentication options for Scalar.
/// </summary>
public sealed class ScalarAuthenticationOptions
{
    /// <summary>
    /// Gets or sets the preferred security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? PreferredSecurityScheme { get; set; }

    /// <summary>
    /// Gets or sets the API key options.
    /// This can be used if the OpenApi document has a API key security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [Obsolete("This property is obsolete and will be removed in a future release. Use SecuritySchemes property to configure API key authentication instead.")]
    public ApiKeyOptions? ApiKey { get; set; }

    /// <summary>
    /// Gets or sets the OAuth2 options.
    /// This can be used if the OpenApi document has a OAuth2 security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [Obsolete("This property is obsolete and will be removed in a future release. Use SecuritySchemes property to configure OAuth2 authentication instead.")]
    public OAuth2Options? OAuth2 { get; set; }

    /// <summary>
    /// Gets or sets the HTTP options.
    /// This can be used if the OpenApi document has a HTTP security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [Obsolete("This property is obsolete and will be removed in a future release. Use SecuritySchemes property to configure HTTP authentication instead.")]
    public HttpOptions? Http { get; set; }

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