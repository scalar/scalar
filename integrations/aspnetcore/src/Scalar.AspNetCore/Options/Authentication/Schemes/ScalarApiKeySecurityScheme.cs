namespace Scalar.AspNetCore;

/// <summary>
/// Represents a security scheme that uses HTTP header authentication.
/// </summary>
/// <remarks>
/// This scheme is used to prefill or overwrite HTTP header values for authentication purposes
/// when making API requests. It allows specifying a custom header name and value pair.
/// </remarks>
public sealed class ScalarApiKeySecurityScheme : ScalarSecurityScheme
{
    /// <summary>
    /// Gets or sets the name of the HTTP header to be used for authentication.
    /// </summary>
    /// <remarks>
    /// Common examples include "Authorization", "X-API-Key", or custom header names.
    /// </remarks>
    public string? Name { get; set; }

    /// <summary>
    /// Gets or sets the value of the HTTP header to be used for authentication.
    /// </summary>
    /// <remarks>
    /// This value will be sent as-is in the specified header. For example, "Bearer token123" or "ApiKey abc123".
    /// </remarks>
    public string? Value { get; set; }
}