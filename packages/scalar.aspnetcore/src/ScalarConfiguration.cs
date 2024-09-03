using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class ScalarConfiguration
{
    public string? Theme { get; init; }

    public bool? ShowSideBar { get; init; }

    public bool? HideModels { get; init; }

    public bool? HideDownloadButton { get; init; }

    public bool? DarkMode { get; init; }

    public bool? HideDarkModeToggle { get; init; }

    public bool? DefaultOpenAllTags { get; init; }

    public bool? WithDefaultFonts { get; init; }

    public string? ForceDarkModeState { get; init; }

    public string? CustomCss { get; init; }

    public string? SearchHotkey { get; init; }

    public IDictionary<string, string[]>? HiddenClients { get; init; }

    public IDictionary<string, string>? Metadata { get; init; }

    public ScalarAuthenticationOptions? Authentication { get; init; }

    public DefaultHttpClient? DefaultHttpClient { get; init; }
}

[JsonSerializable(typeof(ScalarConfiguration))]
[JsonSourceGenerationOptions(DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class ScalaConfigurationSerializerContext : JsonSerializerContext;