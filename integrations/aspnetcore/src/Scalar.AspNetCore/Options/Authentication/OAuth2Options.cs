namespace Scalar.AspNetCore;

/// <summary>
/// Represents the options for OAuth2 authentication.
/// </summary>
/// <remarks>
/// This class is obsolete and will be removed in a future release.
/// Instead of using this class, consider using one of the following extension methods:
/// <list type="bullet">
/// <item><description><see cref="ScalarOptionsExtensions.AddClientCredentialsFlow"/></description></item>
/// <item><description><see cref="ScalarOptionsExtensions.AddAuthorizationCodeFlow"/></description></item>
/// <item><description><see cref="ScalarOptionsExtensions.AddImplicitFlow"/></description></item>
/// <item><description><see cref="ScalarOptionsExtensions.AddPasswordFlow"/></description></item>
/// <item><description><see cref="ScalarOptionsExtensions.AddOAuth2Flows"/></description></item>
/// <item><description><see cref="ScalarOptionsExtensions.AddOAuth2Authentication"/></description></item>
/// </list>
/// </remarks>
[Obsolete("This class is obsolete and will be removed in a future release. Use AddClientCredentialsFlow, AddAuthorizationCodeFlow, AddImplicitFlow, AddPasswordFlow, AddOAuth2Flows or AddOAuth2Authentication instead.")]
public sealed class OAuth2Options
{
    /// <summary>
    /// Gets or sets the client ID for OAuth2 authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? ClientId { get; set; }

    /// <summary>
    /// Gets or sets the scopes for OAuth2 authentication.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public IEnumerable<string>? Scopes { get; set; }
}