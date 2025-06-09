using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Represents the layout for the Scalar API reference.
/// </summary>
[EnumExtensions]
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