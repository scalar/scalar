namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ScalarApiKeySecurityScheme"/>.
/// </summary>
public static class ScalarApiKeySecuritySchemeExtensions
{
    /// <summary>
    /// Sets the name of the HTTP header to be used for authentication.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarApiKeySecurityScheme"/>.</param>
    /// <param name="name">The name of the HTTP header.</param>
    public static ScalarApiKeySecurityScheme WithName(this ScalarApiKeySecurityScheme scheme, string name)
    {
        scheme.Name = name;
        return scheme;
    }

    /// <summary>
    /// Sets the value of the HTTP header to be used for authentication.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarApiKeySecurityScheme"/>.</param>
    /// <param name="value">The value of the HTTP header.</param>
    public static ScalarApiKeySecurityScheme WithValue(this ScalarApiKeySecurityScheme scheme, string value)
    {
        scheme.Value = value;
        return scheme;
    }
}