using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal sealed class ScalarSource
{
    public required string Title { get; init; }

    public string? Url { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public required bool Default { get; init; }

    public string? Content { get; set; }
}