namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for HTTP authentication.
/// </summary>
public sealed class HttpOptions
{
    /// <summary>
    /// Gets or sets the HTTP basic options.
    /// This can be used if the OpenApi document has a HTTP basic security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public HttpBasicOptions? Basic { get; set; }

    /// <summary>
    /// Gets or sets the HTTP bearer options.
    /// This can be used if the OpenApi document has a HTTP bearer security scheme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public HttpBearerOptions? Bearer { get; set; }
}