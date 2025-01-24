namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for API key authentication.
/// </summary>
public sealed class ApiKeyOptions
{
    /// <summary>
    /// Gets or sets the token used for API key authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? Token { get; set; }
}