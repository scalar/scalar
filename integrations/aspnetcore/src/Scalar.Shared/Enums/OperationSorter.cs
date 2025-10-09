using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Specifies the sorting options for operations in the Scalar API reference.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(OperationSorterJsonConverter))]
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