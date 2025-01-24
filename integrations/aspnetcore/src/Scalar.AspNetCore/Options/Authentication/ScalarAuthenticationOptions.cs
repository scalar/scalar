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
    public ApiKeyOptions? ApiKey { get; set; }

    /// <summary>
    /// Gets or sets the OAuth2 options.
    /// This can be used if the OpenApi document has a OAuth2 security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public OAuth2Options? OAuth2 { get; set; }

    /// <summary>
    /// Gets or sets the HTTP options.
    /// This can be used if the OpenApi document has a HTTP security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public HttpOptions? Http { get; set; }
}