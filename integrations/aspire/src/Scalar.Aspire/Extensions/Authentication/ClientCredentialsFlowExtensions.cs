namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="ClientCredentialsFlow"/>.
/// </summary>
public static class ClientCredentialsFlowExtensions
{
    /// <summary>
    /// Sets the token URL for the client credentials flow.
    /// </summary>
    /// <param name="flow"><see cref="ClientCredentialsFlow"/>.</param>
    /// <param name="tokenUrl">The token URL.</param>
    public static ClientCredentialsFlow WithTokenUrl(this ClientCredentialsFlow flow, string? tokenUrl)
    {
        flow.TokenUrl = tokenUrl;
        return flow;
    }

    /// <summary>
    /// Sets the client secret for the client credentials flow.
    /// </summary>
    /// <param name="flow">T<see cref="ClientCredentialsFlow"/>.</param>
    /// <param name="clientSecret">The client secret.</param>
    public static ClientCredentialsFlow WithClientSecret(this ClientCredentialsFlow flow, string? clientSecret)
    {
        flow.ClientSecret = clientSecret;
        return flow;
    }

    /// <summary>
    /// Sets the location where authentication credentials should be placed in HTTP requests for the client credentials flow.
    /// </summary>
    /// <param name="flow">T<see cref="ClientCredentialsFlow"/>.</param>
    /// <param name="credentialsLocation">The location for credentials.</param>
    public static ClientCredentialsFlow WithCredentialsLocation(this ClientCredentialsFlow flow, CredentialsLocation? credentialsLocation)
    {
        flow.CredentialsLocation = credentialsLocation;
        return flow;
    }
}