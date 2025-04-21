using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the base class for security schemes in Scalar.
/// </summary>
[JsonDerivedType(typeof(ScalarHttpSecurityScheme))]
[JsonDerivedType(typeof(ScalarApiKeySecurityScheme))]
[JsonDerivedType(typeof(ScalarOAuth2SecurityScheme))]
public abstract class ScalarSecurityScheme
{
    /// <summary>
    /// Gets or sets the description of this security scheme.
    /// </summary>
    public string? Description { get; set; }
}