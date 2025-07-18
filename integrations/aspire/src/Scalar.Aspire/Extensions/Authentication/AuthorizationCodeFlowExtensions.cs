namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="AuthorizationCodeFlow"/>.
/// </summary>
public static class AuthorizationCodeFlowExtensions
{
    /// <summary>
    /// Sets the authorization URL for the authorization code flow.
    /// </summary>
    /// <param name="flow">The authorization code flow instance.</param>
    /// <param name="authorizationUrl">The authorization URL.</param>
    public static AuthorizationCodeFlow WithAuthorizationUrl(this AuthorizationCodeFlow flow, string? authorizationUrl)
    {
        flow.AuthorizationUrl = authorizationUrl;
        return flow;
    }

    /// <summary>
    /// Sets the token URL for the authorization code flow.
    /// </summary>
    /// <param name="flow"><see cref="AuthorizationCodeFlow"/>.</param>
    /// <param name="tokenUrl">The token URL.</param>
    public static AuthorizationCodeFlow WithTokenUrl(this AuthorizationCodeFlow flow, string? tokenUrl)
    {
        flow.TokenUrl = tokenUrl;
        return flow;
    }

    /// <summary>
    /// Sets the client secret for the authorization code flow.
    /// </summary>
    /// <param name="flow"><see cref="AuthorizationCodeFlow"/>.</param>
    /// <param name="clientSecret">The client secret.</param>
    public static AuthorizationCodeFlow WithClientSecret(this AuthorizationCodeFlow flow, string? clientSecret)
    {
        flow.ClientSecret = clientSecret;
        return flow;
    }

    /// <summary>
    /// Sets the PKCE method for the authorization code flow.
    /// </summary>
    /// <param name="flow"><see cref="AuthorizationCodeFlow"/>.</param>
    /// <param name="pkce">The PKCE method.</param>
    public static AuthorizationCodeFlow WithPkce(this AuthorizationCodeFlow flow, Pkce? pkce)
    {
        flow.Pkce = pkce;
        return flow;
    }

    /// <summary>
    /// Sets the redirect URI for the authorization code flow.
    /// </summary>
    /// <param name="flow"><see cref="AuthorizationCodeFlow"/>.</param>
    /// <param name="redirectUri">The redirect URI.</param>
    public static AuthorizationCodeFlow WithRedirectUri(this AuthorizationCodeFlow flow, string? redirectUri)
    {
        flow.RedirectUri = redirectUri;
        return flow;
    }

    /// <summary>
    /// Sets the location where authentication credentials should be placed in HTTP requests for the authorization code flow.
    /// </summary>
    /// <param name="flow">T<see cref="AuthorizationCodeFlow"/>.</param>
    /// <param name="credentialsLocation">The location for credentials.</param>
    public static AuthorizationCodeFlow WithCredentialsLocation(this AuthorizationCodeFlow flow, CredentialsLocation? credentialsLocation)
    {
        flow.CredentialsLocation = credentialsLocation;
        return flow;
    }
}