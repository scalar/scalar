namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ImplicitFlow"/>.
/// </summary>
public static class ImplicitFlowExtensions
{
    /// <summary>
    /// Sets the authorization URL for the implicit flow.
    /// </summary>
    /// <param name="flow"><see cref="ImplicitFlow"/>.</param>
    /// <param name="authorizationUrl">The authorization URL.</param>
    public static ImplicitFlow WithAuthorizationUrl(this ImplicitFlow flow, string? authorizationUrl)
    {
        flow.AuthorizationUrl = authorizationUrl;
        return flow;
    }

    /// <summary>
    /// Sets the redirect URI for the implicit flow.
    /// </summary>
    /// <param name="flow"><see cref="ImplicitFlow"/>.</param>
    /// <param name="redirectUri">The redirect URI.</param>
    public static ImplicitFlow WithRedirectUri(this ImplicitFlow flow, string? redirectUri)
    {
        flow.RedirectUri = redirectUri;
        return flow;
    }
}