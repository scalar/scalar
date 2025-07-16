using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Specifies the location where authentication credentials should be placed in HTTP requests.
/// </summary>
[EnumExtensions]
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