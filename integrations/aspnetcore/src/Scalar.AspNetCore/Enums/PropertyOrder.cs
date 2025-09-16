using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Specifies the ordering options for schema properties in the Scalar API reference.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(PropertyOrderJsonConverter))]
public enum PropertyOrder
{
    /// <summary>
    /// Preserve the original order of schema properties.
    /// </summary>
    [Description("preserve")]
    Preserve,

    /// <summary>
    /// Sort schema properties alphabetically.
    /// </summary>
    [Description("alpha")]
    Alpha
}