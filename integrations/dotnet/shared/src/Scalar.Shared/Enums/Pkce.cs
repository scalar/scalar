using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Represents the Proof Key for Code Exchange (PKCE) method types used in the OAuth 2 authorization code flow.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(PkceJsonConverter))]
public enum Pkce
{
    /// <summary>
    /// Disables PKCE.
    /// </summary>
    [Description("no")]
    No,

    /// <summary>
    /// Uses plain code challenge method.
    /// </summary>
    [Description("plain")]
    Plain,

    /// <summary>
    /// Uses SHA-256 code challenge method.
    /// </summary>
    [Description("SHA-256")]
    Sha256
}