using Microsoft.AspNetCore.Http;

namespace Scalar.AspNetCore;

internal static class HttpRequestExtensions
{
    public static bool IsGzipAccepted(this HttpRequest httpRequest)
    {
        var acceptEncoding = httpRequest.Headers.AcceptEncoding;
        // ReSharper disable once ForCanBeConvertedToForeach
        for (var index = 0; index < acceptEncoding.Count; index++)
        {
            var stringValue = acceptEncoding[index].AsSpan();
            if (stringValue.Contains("gzip", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}