using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the base class for security schemes in Scalar.
/// </summary>
[JsonDerivedType(typeof(ScalarHttpSecurityScheme))]
[JsonDerivedType(typeof(ScalarApiKeySecurityScheme))]
[JsonDerivedType(typeof(ScalarOAuth2SecurityScheme))]
public abstract class ScalarSecurityScheme;