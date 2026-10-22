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
/// Represents a security scheme that uses OpenID Connect authentication.
/// </summary>
/// <remarks>
/// This scheme is used to prefill or overwrite OAuth 2.0 authentication values
/// after discovery. Only flows supported by the discovery document are available.
/// When exactly one flow is configured, it is selected initially if discovered.
/// </remarks>
public sealed class ScalarOpenIdConnectSecurityScheme : ScalarSecurityScheme
{
    /// <summary>
    /// Gets or sets the OAuth 2.0 flows configuration for this security scheme.
    /// </summary>
    /// <remarks>
    /// Contains configuration for different OAuth flow types like implicit, password,
    /// client credentials, or authorization code. These defaults do not bypass discovery.
    /// </remarks>
    public ScalarFlows? Flows { get; set; }

    /// <summary>
    /// Gets or sets the default OAuth 2.0 scopes to request during authorization.
    /// </summary>
    /// <remarks>
    /// These scopes are prefilled or used to overwrite the requested scopes when initiating
    /// the OAuth flow.
    /// </remarks>
    [JsonPropertyName("x-default-scopes")]
    public IEnumerable<string>? DefaultScopes { get; set; }
}