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

    public required bool? HideModels { get; init; }

    public required bool? HideDownloadButton { get; init; }

    public required bool? HideTestRequestButton { get; init; }

    public required bool? DarkMode { get; init; }

    public required string? ForceDarkModeState { get; init; }

    public required bool? HideDarkModeToggle { get; init; }

    public required string? CustomCss { get; init; }

    public required string? SearchHotKey { get; init; }

    public required IEnumerable<ScalarServer>? Servers { get; init; }

    public required IDictionary<string, string>? MetaData { get; init; }

    public required DefaultHttpClient? DefaultHttpClient { get; init; }

    /// <remarks>
    /// This could be a dictionary of <see cref="ScalarTarget"/> and <see cref="ScalarClient"/> arrays or a boolean if all clients are hidden.
    /// </remarks>
    public required object? HiddenClients { get; init; }

    public required ScalarAuthenticationOptions? Authentication { get; init; }

    public required bool? WithDefaultFonts { get; init; }

    public required bool? DefaultOpenAllTags { get; init; }

    public required string? TagSorter { get; init; }

    public required string? OperationsSorter { get; init; }

    public required string? Theme { get; init; }

    public required string? Layout { get; init; }

    public required string? Favicon { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
    [JsonPropertyName("_integration")]
    public required string? Integration { get; init; }

    public required bool HideClientButton { get; init; }

    /// <remarks>This feature will be public once we support multiple OpenAPI documents</remarks>
    [JsonIgnore(Condition = JsonIgnoreCondition.Always)]
    internal IEnumerable<string> Documents { get; init; } = null!;
}

[JsonSerializable(typeof(ScalarConfiguration))]
[JsonSerializable(typeof(Dictionary<string, IEnumerable<string>>))] // Type of hidden clients
[JsonSourceGenerationOptions(DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class ScalarConfigurationSerializerContext : JsonSerializerContext;