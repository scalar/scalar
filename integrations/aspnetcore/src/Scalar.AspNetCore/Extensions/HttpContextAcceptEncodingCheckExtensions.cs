using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace Scalar.AspNetCore;

/// <summary>
/// <see cref="HttpContext"/> Accept-Encoding check extensions
/// </summary>
internal static partial class HttpContextAcceptEncodingCheckExtensions
{
    private static readonly Regex SGzipAcceptedCheckRegex = GetGZipAcceptedCheckRegex();

    /// <summary>
    /// Check is the <paramref name="httpContext"/> support gzip response
    /// </summary>
    /// <param name="httpContext"></param>
    /// <returns>is gzip response accepted</returns>
    public static bool IsGZipAccepted(this HttpContext httpContext) => IsGZipAccepted(httpContext.Request.Headers.AcceptEncoding);

    [GeneratedRegex(@"(^|,)\s*gzip\s*(;|,|$)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex GetGZipAcceptedCheckRegex();

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static bool IsGZipAccepted(string? acceptEncoding) => !string.IsNullOrWhiteSpace(acceptEncoding) && SGzipAcceptedCheckRegex.IsMatch(acceptEncoding);

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static bool IsGZipAccepted(in StringValues acceptEncodingValues)
    {
        return acceptEncodingValues.Count switch
        {
            0 => false,
            1 => IsGZipAccepted(acceptEncodingValues[0]),
            _ => SlowCheckIsGZipAccepted(in acceptEncodingValues),
        };
    }

    private static bool SlowCheckIsGZipAccepted(in StringValues values)
    {
        var valuesCount = values.Count;
        for (var i = 0; i < valuesCount; i++)
        {
            if (IsGZipAccepted(values[i]))
            {
                return true;
            }
        }
        return false;
    }
}
