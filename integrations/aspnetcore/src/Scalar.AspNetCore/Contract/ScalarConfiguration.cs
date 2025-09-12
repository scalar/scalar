using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

/// <summary>
/// Internal representation of the configuration for the Scalar API reference.
/// Based on <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
/// </summary>
internal sealed class ScalarConfiguration
{
    public required string? ProxyUrl { get; init; }

    public required bool? ShowSidebar { get; init; }

    public required OperationTitleSource? OperationTitleSource { get; init; }

    public required bool? HideModels { get; init; }

    public required bool? HideTestRequestButton { get; init; }

    public required bool? DarkMode { get; init; }

    public required ThemeMode? ForceDarkModeState { get; init; }

    public required bool? HideDarkModeToggle { get; init; }

    public required string? CustomCss { get; init; }

    public required string? SearchHotKey { get; init; }

    public required IEnumerable<ScalarServer>? Servers { get; init; }

    public required IDictionary<string, string>? MetaData { get; init; }

    public required DefaultHttpClient? DefaultHttpClient { get; init; }

    /// <remarks>
    /// This could be a dictionary of <see cref="ScalarTarget" /> and <see cref="ScalarClient" /> arrays or a boolean if all clients are hidden.
    /// </remarks>
    public required object? HiddenClients { get; init; }

    public required ScalarAuthenticationOptions? Authentication { get; init; }

    public required bool? WithDefaultFonts { get; init; }

    public required bool? DefaultOpenAllTags { get; init; }

    [JsonPropertyName("tagsSorter")]
    public required TagSorter? TagSorter { get; init; }

    public required OperationSorter? OperationsSorter { get; init; }

    public required ScalarTheme? Theme { get; init; }

    public required ScalarLayout? Layout { get; init; }

    public required string? Favicon { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
    [JsonPropertyName("_integration")]
    public required string? Integration { get; init; }

    public required bool HideClientButton { get; init; }

    public required IEnumerable<ScalarSource> Sources { get; init; }

    [JsonPropertyName("baseServerURL")]
    public required string? BaseServerUrl { get; init; }

    public required bool PersistAuth { get; init; }

    public required DocumentDownloadType? DocumentDownloadType { get; init; }

    public required bool OrderRequiredPropertiesFirst { get; init; }

    public required PropertyOrder? OrderSchemaPropertiesBy { get; init; }
}

[JsonSerializable(typeof(ScalarConfiguration))]
[JsonSerializable(typeof(Dictionary<ScalarTarget, ScalarClient[]>))] // Type of hidden clients
[JsonSourceGenerationOptions(DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class ScalarConfigurationSerializerContext : JsonSerializerContext;