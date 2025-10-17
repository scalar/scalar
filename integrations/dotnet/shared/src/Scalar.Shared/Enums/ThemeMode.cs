using System.ComponentModel;
using System.Text.Json.Serialization;
using NetEscapades.EnumGenerators;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Represents the theme modes available in the application.
/// </summary>
[EnumExtensions]
[JsonConverter(typeof(ThemeModeJsonConverter))]
public enum ThemeMode
{
    /// <summary>
    /// Light mode.
    /// </summary>
    [Description("light")]
    Light,

    /// <summary>
    /// Dark mode.
    /// </summary>
    [Description("dark")]
    Dark
}