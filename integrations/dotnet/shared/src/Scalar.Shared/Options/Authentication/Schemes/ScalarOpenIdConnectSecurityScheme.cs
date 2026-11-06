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
// OpenID Connect uses the same OAuth flow settings, so the OAuth configuration
// helpers can update discovered-flow defaults without replacing the scheme.
public sealed class ScalarOpenIdConnectSecurityScheme : ScalarOAuth2SecurityScheme;
