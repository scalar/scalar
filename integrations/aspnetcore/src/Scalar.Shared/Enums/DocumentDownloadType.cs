using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Specifies the available download formats for API documentation.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(DocumentDownloadTypeJsonConverter))]
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
    /// Show the regular link to the OpenAPI document.
    /// </summary>
    [Description("direct")]
    Direct,

    /// <summary>
    /// Do not allow documentation downloads.
    /// </summary>
    [Description("none")]
    None
}