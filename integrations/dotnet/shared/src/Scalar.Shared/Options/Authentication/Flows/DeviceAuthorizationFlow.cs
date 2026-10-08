using System.Text.Json.Serialization;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Represents the OAuth2 Device Authorization flow configuration.
/// </summary>
public sealed class DeviceAuthorizationFlow : OAuthFlow
{
    /// <summary>
    /// Gets or sets the URL used to request a device code and user code.
    /// </summary>
    public string? DeviceAuthorizationUrl { get; set; }

    /// <summary>
    /// Gets or sets the token URL to be used for this flow.
    /// </summary>
    public string? TokenUrl { get; set; }

    /// <summary>
    /// Gets or sets the client secret used for authentication.
    /// </summary>
    public string? ClientSecret { get; set; }

    /// <summary>
    /// Gets or sets the location where authentication credentials should be placed in HTTP requests.
    /// </summary>
    [JsonPropertyName("x-scalar-credentials-location")]
    public CredentialsLocation? CredentialsLocation { get; set; }
}