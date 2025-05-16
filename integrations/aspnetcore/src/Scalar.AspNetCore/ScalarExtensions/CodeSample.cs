using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class CodeSample
{
    public required string Source { get; init; }

    [JsonPropertyName("lang")]
    public string? Language { get; set; }

    public string? Label { get; set; }
}