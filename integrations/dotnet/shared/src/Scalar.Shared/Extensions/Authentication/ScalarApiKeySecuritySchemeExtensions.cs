#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Extension methods for <see cref="ScalarApiKeySecurityScheme"/>.
/// </summary>
public static class ScalarApiKeySecuritySchemeExtensions
{
    /// <summary>
    /// Sets the prefix added to header API keys. Credentials must not include the prefix.
    /// </summary>
    /// <param name="scheme">The security scheme.</param>
    /// <param name="prefix">The token prefix.</param>
    public static ScalarApiKeySecurityScheme WithTokenPrefix(this ScalarApiKeySecurityScheme scheme, string prefix)
    {
        scheme.TokenPrefix = prefix;
        return scheme;
    }

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