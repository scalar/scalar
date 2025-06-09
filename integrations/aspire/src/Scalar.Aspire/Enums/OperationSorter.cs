using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Specifies the sorting options for operations in the Scalar API reference.
/// </summary>
[EnumExtensions]
public enum OperationSorter
{
    /// <summary>
    /// Sort operations alphabetically.
    /// </summary>
    [Description("alpha")]
    Alpha,

    /// <summary>
    /// Sort operations by method.
    /// </summary>
    [Description("method")]
    Method
}