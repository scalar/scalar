#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

internal sealed class DefaultHttpClient
{
    public required ScalarTarget TargetKey { get; init; }

    public required ScalarClient ClientKey { get; init; }
}