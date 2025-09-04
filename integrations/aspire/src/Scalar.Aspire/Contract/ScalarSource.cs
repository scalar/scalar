using System.Text.Json.Serialization;

namespace Scalar.Aspire;

internal sealed class ScalarSource
{
    public required string Title { get; init; }

    public required string Url { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public required bool Default { get; init; }
}