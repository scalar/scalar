namespace Scalar.AspNetCore;

internal sealed class DefaultHttpClient
{
    public required ScalarTarget TargetKey { get; init; }

    public required ScalarClient ClientKey { get; init; }
}