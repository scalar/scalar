using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Specifies the available download formats for API documentation.
/// </summary>
[EnumExtensions]
public enum DocumentDownloadType
{
    /// <summary>
    /// Download documentation in JSON format.
    /// </summary>
    [Description("json")]
    Json,

    /// <summary>
    /// Download documentation in YAML format.
    /// </summary>
    [Description("yaml")]
    Yaml,

    /// <summary>
    /// Download documentation in both JSON and YAML formats.
    /// </summary>
    [Description("both")]
    Both,

    /// <summary>
    /// Do not allow documentation downloads.
    /// </summary>
    [Description("none")]
    None
}