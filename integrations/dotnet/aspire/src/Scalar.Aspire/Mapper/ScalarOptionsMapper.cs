using System.Runtime.CompilerServices;

namespace Scalar.Aspire;

internal static partial class ScalarOptionsMapper
{
    internal static async IAsyncEnumerable<ScalarConfiguration> ToScalarConfigurationsAsync(this IAsyncEnumerable<ScalarOptions> options, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var option in options.WithCancellation(cancellationToken))
        {
            yield return option.ToScalarConfiguration();
        }
    }
}