using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Controls the visibility of the configuration toolbar.
/// </summary>
[EnumExtensions]
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