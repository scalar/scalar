using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Internal representation of the configuration for the Scalar API reference.
/// Based on <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
/// </summary>
internal sealed class ScalarConfiguration
{
    public required string? Proxy { get; init; }

    public required bool? ShowSidebar { get; init; }

    public required bool? HideModels { get; init; }

    public required bool? HideDownloadButton { get; init; }

    public required bool? HideTestRequestButton { get; init; }

    public required bool? DarkMode { get; init; }

    public required string? ForceDarkModeState { get; init; }

    public required bool? HideDarkModeToggle { get; init; }

    public required string? CustomCss { get; init; }

    public required string? SearchHotKey { get; init; }

    public required IEnumerable<ScalarServer>? Servers { get; init; }
    
    public required IDictionary<string, string>? Metadata { get; init; }

    public required DefaultHttpClient? DefaultHttpClient { get; init; }

    public required IDictionary<string, string[]>? HiddenClients { get; init; }

    public required ScalarAuthenticationOptions? Authentication { get; init; }

    public required bool? WithDefaultFonts { get; init; }

    public required bool? DefaultOpenAllTags { get; init; }

    public required string? Theme { get; init; }
}

[JsonSerializable(typeof(ScalarConfiguration))]
[JsonSourceGenerationOptions(DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class ScalaConfigurationSerializerContext : JsonSerializerContext;