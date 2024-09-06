﻿using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents the different themes available in Scalar.
/// </summary>
[EnumExtensions]
public enum ScalarTheme
{
    /// <summary>
    /// No theme applied.
    /// </summary>
    [Description("none")]
    None,

    /// <summary>
    /// Alternate theme.
    /// </summary>
    [Description("alternate")]
    Alternate,

    /// <summary>
    /// Default theme.
    /// </summary>
    [Description("default")]
    Default,

    /// <summary>
    /// Moon theme.
    /// </summary>
    [Description("moon")]
    Moon,

    /// <summary>
    /// Purple theme.
    /// </summary>
    [Description("purple")]
    Purple,

    /// <summary>
    /// Solarized theme.
    /// </summary>
    [Description("solarized")]
    Solarized,

    /// <summary>
    /// Blue Planet theme.
    /// </summary>
    [Description("blueplanet")]
    BluePlanet,

    /// <summary>
    /// Saturn theme.
    /// </summary>
    [Description("saturn")]
    Saturn,

    /// <summary>
    /// Kepler theme.
    /// </summary>
    [Description("kepler")]
    Kepler,

    /// <summary>
    /// Mars theme.
    /// </summary>
    [Description("mars")]
    Mars,

    /// <summary>
    /// Deep Space theme.
    /// </summary>
    [Description("deepspace")]
    DeepSpace
}