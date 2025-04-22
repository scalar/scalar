using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the stability level of an API endpoint.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(StabilityJsonConverter))]
public enum Stability
{
    /// <summary>
    /// Indicates a stable API.
    /// </summary>
    [Description("stable")]
    Stable,

    /// <summary>
    /// Indicates an experimental API that may change without notice.
    /// </summary>
    [Description("experimental")]
    Experimental,

    /// <summary>
    /// Indicates a deprecated API that may be removed in future versions.
    /// </summary>
    [Description("deprecated")]
    Deprecated
}