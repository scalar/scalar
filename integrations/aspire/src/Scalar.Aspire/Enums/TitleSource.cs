using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Represents the theme modes available in the application.
/// </summary>
[EnumExtensions]
public enum TitleSource
{
    /// <summary>
    /// Title comes from operation summary.
    /// </summary>
    [Description("summary")]
    Summary,

    /// <summary>
    /// Title comes from operation path.
    /// </summary>
    [Description("path")]
    Path
}
