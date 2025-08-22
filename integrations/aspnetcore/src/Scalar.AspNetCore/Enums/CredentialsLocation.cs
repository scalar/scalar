using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

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