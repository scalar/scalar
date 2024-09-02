using System.ComponentModel;

namespace Scalar.AspNetCore;

public enum ScalarThemes
{
    [Description("none")]
    None,

    [Description("alternate")]
    Alternate,

    [Description("default")]
    Default,

    [Description("moon")]
    Moon,

    [Description("purple")]
    Purple,

    [Description("solarized")]
    Solarized,

    [Description("blueplanet")]
    BluePlanet,

    [Description("saturn")]
    Saturn,

    [Description("kepler")]
    Kepler,

    [Description("mars")]
    Mars,

    [Description("deepspace")]
    DeepSpace
}