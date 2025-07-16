namespace Scalar.Aspire;

/// <summary>
/// Extension methods for <see cref="PasswordFlow"/>.
/// </summary>
public static class PasswordFlowExtensions
{
    /// <summary>
    /// Sets the token URL for the password flow.
    /// </summary>
    /// <param name="flow"><see cref="PasswordFlow"/>.</param>
    /// <param name="tokenUrl">The token URL.</param>
    public static PasswordFlow WithTokenUrl(this PasswordFlow flow, string? tokenUrl)
    {
        flow.TokenUrl = tokenUrl;
        return flow;
    }

    /// <summary>
    /// Sets the client secret for the password flow.
    /// </summary>
    /// <param name="flow"><see cref="PasswordFlow"/>.</param>
    /// <param name="clientSecret">The client secret.</param>
    public static PasswordFlow WithClientSecret(this PasswordFlow flow, string? clientSecret)
    {
        flow.ClientSecret = clientSecret;
        return flow;
    }

    /// <summary>
    /// Sets the username for the password flow.
    /// </summary>
    /// <param name="flow"><see cref="PasswordFlow"/>.</param>
    /// <param name="username">The username.</param>
    public static PasswordFlow WithUsername(this PasswordFlow flow, string? username)
    {
        flow.Username = username;
        return flow;
    }

    /// <summary>
    /// Sets the password for the password flow.
    /// </summary>
    /// <param name="flow"><see cref="PasswordFlow"/>.</param>
    /// <param name="password">The password.</param>
    public static PasswordFlow WithPassword(this PasswordFlow flow, string? password)
    {
        flow.Password = password;
        return flow;
    }

    /// <summary>
    /// Sets the location where authentication credentials should be placed in HTTP requests for the password flow.
    /// </summary>
    /// <param name="flow">T<see cref="PasswordFlow"/>.</param>
    /// <param name="credentialsLocation">The location for credentials.</param>
    public static PasswordFlow WithCredentialsLocation(this PasswordFlow flow, CredentialsLocation? credentialsLocation)
    {
        flow.CredentialsLocation = credentialsLocation;
        return flow;
    }
}