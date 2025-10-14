#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

internal sealed class DefaultHttpClient
{
    public required ScalarTarget TargetKey { get; init; }

    public required ScalarClient ClientKey { get; init; }
}