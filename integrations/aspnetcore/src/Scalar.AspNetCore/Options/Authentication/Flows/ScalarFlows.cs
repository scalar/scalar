namespace Scalar.AspNetCore;

/// <summary>
/// Represents the available OAuth 2.0 flows for authentication.
/// </summary>
/// <remarks>
/// This class defines the different OAuth 2.0 flow types that can be used for authentication.
/// Each flow type has its own configuration properties that are used to prefill or overwrite
/// values during the authentication process.
/// </remarks>
public sealed class ScalarFlows
{
    /// <summary>
    /// Gets or sets the implicit flow configuration.
    /// </summary>
    public ImplicitFlow? Implicit { get; set; }

    /// <summary>
    /// Gets or sets the password flow configuration.
    /// </summary>
    public PasswordFlow? Password { get; set; }

    /// <summary>
    /// Gets or sets the client credentials flow configuration.
    /// </summary>
    public ClientCredentialsFlow? ClientCredentials { get; set; }

    /// <summary>
    /// Gets or sets the authorization code flow configuration.
    /// </summary>
    public AuthorizationCodeFlow? AuthorizationCode { get; set; }
}