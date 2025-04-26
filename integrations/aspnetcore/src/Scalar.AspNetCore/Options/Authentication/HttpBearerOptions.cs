namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for HTTP bearer authentication.
/// </summary>
[Obsolete("This class is obsolete and will be removed in a future release. Use AddHttpBasicAuthentication with ScalarHttpSecurityScheme instead.")]
public sealed class HttpBearerOptions
{
    /// <summary>
    /// Gets or sets the token used for HTTP bearer authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? Token { get; set; }
}