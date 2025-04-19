using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the Proof Key for Code Exchange (PKCE) method types used in the OAuth 2 authorization code flow.
/// </summary>
[EnumExtensions]
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