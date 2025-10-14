using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the position of a badge in relation to the operation header.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(BadgePositionJsonConverter))]
public enum BadgePosition
{
    /// <summary>
    /// Position the badge after the operation header (default).
    /// </summary>
    [Description("after")]
    After,

    /// <summary>
    /// Position the badge before the operation header.
    /// </summary>
    [Description("before")]
    Before
}