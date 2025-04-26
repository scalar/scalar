namespace Scalar.AspNetCore;

/// <summary>
/// Represents a security scheme that uses HTTP authentication mechanisms like Basic or Bearer.
/// </summary>
/// <remarks>
/// This scheme is used to prefill or overwrite authentication values.
/// It supports both Basic authentication (username/password) and Bearer authentication (token).
/// </remarks>
public sealed class ScalarHttpSecurityScheme : ScalarSecurityScheme
{
    /// <summary>
    /// Gets or sets the username used for HTTP basic authentication.
    /// </summary>
    /// <remarks>
    /// When provided, this value will be used to prefill or overwrite the username
    /// for Basic authentication requests.
    /// </remarks>
    /// <value>The default value is <c>null</c>.</value>
    public string? Username { get; set; }

    /// <summary>
    /// Gets or sets the password used for HTTP basic authentication.
    /// </summary>
    /// <remarks>
    /// When provided, this value will be used to prefill or overwrite the password
    /// for Basic authentication requests.
    /// </remarks>
    /// <value>The default value is <c>null</c>.</value>
    public string? Password { get; set; }

    /// <summary>
    /// Gets or sets the token used for HTTP bearer authentication.
    /// </summary>
    /// <remarks>
    /// When provided, this value will be used to prefill or overwrite the token
    /// for Bearer authentication requests.
    /// </remarks>
    /// <value>The default value is <c>null</c>.</value>
    public string? Token { get; set; }
}