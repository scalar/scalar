namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="OAuthFlow"/>.
/// </summary>
public static class OAuthFlowExtensions
{
    /// <summary>
    /// Sets the URL to be used for obtaining refresh tokens.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="refreshUrl">The refresh URL.</param>
    public static T WithRefreshUrl<T>(this T flow, string? refreshUrl) where T : OAuthFlow
    {
        flow.RefreshUrl = refreshUrl;
        return flow;
    }

    /// <summary>
    /// Sets the preselected scopes for the request.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="scopes">The scopes to select.</param>
    public static T WithSelectedScopes<T>(this T flow, params IEnumerable<string>? scopes) where T : OAuthFlow
    {
        flow.SelectedScopes = scopes;
        return flow;
    }

    /// <summary>
    /// Sets the client ID associated with the OAuth flow.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="clientId">The client ID.</param>
    public static T WithClientId<T>(this T flow, string? clientId) where T : OAuthFlow
    {
        flow.ClientId = clientId;
        return flow;
    }

    /// <summary>
    /// Sets the authentication token.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="token">The authentication token.</param>
    public static T WithToken<T>(this T flow, string? token) where T : OAuthFlow
    {
        flow.Token = token;
        return flow;
    }

    /// <summary>
    /// Adds a query parameter that should be included in the auth request.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="key">The parameter key.</param>
    /// <param name="value">The parameter value.</param>
    public static T AddQueryParameter<T>(this T flow, string key, string value) where T : OAuthFlow
    {
        flow.AdditionalQueryParameters ??= new Dictionary<string, string>();
        flow.AdditionalQueryParameters.TryAdd(key, value);
        return flow;
    }
    
    /// <summary>
    /// Adds a body parameter that should be included in the token request.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="key">The parameter key.</param>
    /// <param name="value">The parameter value.</param>
    public static T AddBodyParameter<T>(this T flow, string key, string value) where T : OAuthFlow
    {
        flow.AdditionalBodyParameters ??= new Dictionary<string, string>();
        flow.AdditionalBodyParameters.TryAdd(key, value);
        return flow;
    }
    
    /// <summary>
    /// Sets the name of the token used in the OAuth flow.
    /// </summary>
    /// <typeparam name="T">The type of OAuth flow.</typeparam>
    /// <param name="flow"><see cref="OAuthFlow"/>.</param>
    /// <param name="tokenName">The name of the token.</param>
    public static T WithTokenName<T>(this T flow, string? tokenName) where T : OAuthFlow
    {
        flow.TokenName = tokenName;
        return flow;
    }
}