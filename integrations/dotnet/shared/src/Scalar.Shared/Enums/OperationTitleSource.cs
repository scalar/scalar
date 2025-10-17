using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Which part of the operation description to display as the operation title.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(OperationTitleSourceJsonConverter))]
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