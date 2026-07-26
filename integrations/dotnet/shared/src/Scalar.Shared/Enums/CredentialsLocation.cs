using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

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
/// Specifies the location where authentication credentials should be placed in HTTP requests.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(CredentialsLocationJsonConverter))]
public enum CredentialsLocation
{
    /// <summary>
    /// Credentials are included in the request body.
    /// </summary>
    [Description("body")]
    Body,

    /// <summary>
    /// Credentials are included in the request headers.
    /// </summary>
    [Description("header")]
    Header
}