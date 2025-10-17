using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Controls the visibility of the configuration toolbar.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(ToolbarVisibilityJsonConverter))]
internal enum ToolbarVisibility
{
    /// <summary>
    /// Always show the toolbar.
    /// </summary>
    [Description("always")]
    Always,

    /// <summary>
    /// Only show the toolbar on localhost or similar hosts.
    /// </summary>
    [Description("localhost")]
    Localhost,

    /// <summary>
    /// Never show the toolbar.
    /// </summary>
    [Description("never")]
    Never
}