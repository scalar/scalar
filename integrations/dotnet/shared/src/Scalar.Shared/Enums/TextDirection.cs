using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#elif SCALAR_AWS_LAMBDA
namespace Scalar.Aws.Lambda;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Text direction for localized interface labels.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(TextDirectionJsonConverter))]
public enum TextDirection
{
    /// <summary>
    /// Derive the direction from the locale.
    /// </summary>
    [Description("auto")]
    Auto,

    /// <summary>
    /// Left-to-right text.
    /// </summary>
    [Description("ltr")]
    LeftToRight,

    /// <summary>
    /// Right-to-left text.
    /// </summary>
    [Description("rtl")]
    RightToLeft
}
