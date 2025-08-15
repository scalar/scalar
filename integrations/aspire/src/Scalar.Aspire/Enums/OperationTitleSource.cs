using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Which part of the operation description to display as the operation title.
/// </summary>
[EnumExtensions]
public enum OperationTitleSource
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
