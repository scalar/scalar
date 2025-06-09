namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ScalarOAuth2SecurityScheme"/>.
/// </summary>
public static class ScalarOAuth2SecuritySchemeExtensions
{
    /// <summary>
    /// Sets the OAuth 2.0 flows configuration for this security scheme.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarOAuth2SecurityScheme"/>.</param>
    /// <param name="configureFlows">An action to configure the flows.</param>
    public static ScalarOAuth2SecurityScheme WithFlows(this ScalarOAuth2SecurityScheme scheme, Action<ScalarFlows> configureFlows)
    {
        scheme.Flows ??= new ScalarFlows();
        configureFlows(scheme.Flows);
        return scheme;
    }

    /// <summary>
    /// Sets the default OAuth 2.0 scopes to request during authorization.
    /// </summary>
    /// <param name="scheme"><see cref="ScalarOAuth2SecurityScheme"/>.</param>
    /// <param name="scopes">The default scopes for OAuth 2.0.</param>
    public static ScalarOAuth2SecurityScheme WithDefaultScopes(this ScalarOAuth2SecurityScheme scheme, params IEnumerable<string> scopes)
    {
        scheme.DefaultScopes = scopes;
        return scheme;
    }
}