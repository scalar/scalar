using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Specifies the sorting options for tags in the Scalar API reference.
/// </summary>
[EnumExtensions]
public enum TagSorter
{
    /// <summary>
    /// Sort tags alphabetically.
    /// </summary>
    [Description("alpha")]
    Alpha
}