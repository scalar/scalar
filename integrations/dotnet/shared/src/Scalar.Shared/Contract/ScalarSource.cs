using System.Text.Json.Serialization;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

internal sealed class ScalarSource
{
    public required string Title { get; init; }

    public required string Url { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public required bool Default { get; init; }
}