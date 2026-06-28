using System.Text.Json.Serialization;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

internal sealed class ScalarSource
{
    public required string Title { get; init; }

    public required string Url { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public required bool Default { get; init; }

    public ScalarAgentOptions? Agent { get; init; }
}