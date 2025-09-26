using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Specifies the ordering options for schema properties in the Scalar API reference.
/// </summary>
[EnumExtensions]
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