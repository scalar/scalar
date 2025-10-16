using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class CodeSample
{
    public required string Source { get; init; }

    [JsonPropertyName("lang")]
    public required ScalarTarget? Language { get; init; }

    public required string? Label { get; init; }
}