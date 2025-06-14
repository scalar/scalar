namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ScalarHttpSecurityScheme"/>.
/// </summary>
public static class ScalarHttpSecuritySchemeExtensions
{
    /// <summary>
    /// Sets the username used for HTTP basic authentication.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarHttpSecurityScheme"/>.</param>
    /// <param name="username">The username for basic authentication.</param>
    public static ScalarHttpSecurityScheme WithUsername(this ScalarHttpSecurityScheme scheme, string username)
    {
        scheme.Username = username;
        return scheme;
    }

    /// <summary>
    /// Sets the password used for HTTP basic authentication.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarHttpSecurityScheme"/>.</param>
    /// <param name="password">The password for basic authentication.</param>
    public static ScalarHttpSecurityScheme WithPassword(this ScalarHttpSecurityScheme scheme, string password)
    {
        scheme.Password = password;
        return scheme;
    }

    /// <summary>
    /// Sets the token used for HTTP bearer authentication.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarHttpSecurityScheme"/>.</param>
    /// <param name="token">The token for bearer authentication.</param>
    public static ScalarHttpSecurityScheme WithToken(this ScalarHttpSecurityScheme scheme, string token)
    {
        scheme.Token = token;
        return scheme;
    }
}