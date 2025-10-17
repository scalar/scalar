using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

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