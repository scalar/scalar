namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ScalarSecurityScheme"/>.
/// </summary>
public static class ScalarSecuritySchemeExtensions
{
    /// <summary>
    /// Sets the description of this security scheme.
    /// </summary>
    /// <typeparam name="T">The type of security scheme.</typeparam>
    /// <param name="scheme"><see cref="ScalarSecurityScheme"/>.</param>
    /// <param name="description">The description of the security scheme.</param>
    public static T WithDescription<T>(this T scheme, string description) where T : ScalarSecurityScheme
    {
        scheme.Description = description;
        return scheme;
    }
}