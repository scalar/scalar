using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the layout for the Scalar API reference.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(ScalarLayoutJsonConverter))]
public enum ScalarLayout
{
    /// <summary>
    /// Modern layout style.
    /// </summary>
    [Description("modern")]
    Modern,

    /// <summary>
    /// Classic layout style.
    /// </summary>
    [Description("classic")]
    Classic
}