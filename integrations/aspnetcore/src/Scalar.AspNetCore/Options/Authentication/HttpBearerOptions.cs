namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for HTTP bearer authentication.
/// </summary>
public sealed class HttpBearerOptions
{
    /// <summary>
    /// Gets or sets the token used for HTTP bearer authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? Token { get; set; }
}