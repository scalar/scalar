#if !SCALAR_ASPIRE
using System.Collections.Concurrent;
using System.Reflection;
using System.Security.Cryptography;
#if RELEASE
using System.IO.Compression;
#endif

#if SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Represents a resolved static asset ready to be written to a response.
/// </summary>
internal readonly struct ScalarStaticAsset
{
    /// <summary>The asset content stream. The caller is responsible for disposing it.</summary>
    public required Stream Stream { get; init; }

    /// <summary>A stable, content-based entity tag (already quoted).</summary>
    public required string ETag { get; init; }

    /// <summary>The content encoding to advertise (e.g. <c>gzip</c>), or <c>null</c> when the content is uncompressed.</summary>
    public string? ContentEncoding { get; init; }
}

/// <summary>
/// Resolves Scalar's embedded static assets (the standalone bundle, the helper script and the favicon)
/// from the integration assembly without taking a dependency on any web framework.
/// </summary>
/// <remarks>
/// Assets are embedded under the <c>ScalarStaticAssets</c> logical-name prefix. In <c>Release</c> builds the
/// embedded resources are pre-gzipped, so they are streamed verbatim when the client accepts gzip and
/// transparently decompressed otherwise. In <c>Debug</c> builds the resources are stored uncompressed.
/// </remarks>
internal static class ScalarStaticAssets
{
    private const string ResourcePrefix = "ScalarStaticAssets.";

    // The shared sources are link-compiled into each integration assembly, so this resolves to the
    // assembly that actually embeds the static assets (e.g. Scalar.AspNetCore or Scalar.Azure.Functions).
    private static readonly Assembly Assembly = typeof(ScalarStaticAssets).Assembly;

    private static readonly ConcurrentDictionary<string, string> ETagCache = new(StringComparer.Ordinal);

    /// <summary>
    /// Attempts to resolve an embedded static asset by file name.
    /// </summary>
    /// <param name="fileName">The asset file name, e.g. <c>scalar.js</c>.</param>
    /// <param name="gzipAccepted">Whether the client accepts gzip-encoded responses.</param>
    /// <param name="asset">The resolved asset when the method returns <c>true</c>.</param>
    /// <returns><c>true</c> if the asset exists; otherwise <c>false</c>.</returns>
    internal static bool TryGetAsset(string fileName, bool gzipAccepted, out ScalarStaticAsset asset)
    {
        var resourceName = ResourcePrefix + fileName;
        var stream = Assembly.GetManifestResourceStream(resourceName);

#if RELEASE
        // The embedded resource is gzip-compressed in Release builds.
        if (stream is not null)
        {
            var etag = ETagCache.GetOrAdd(resourceName, static name => ComputeETag(name));
            if (gzipAccepted)
            {
                asset = new ScalarStaticAsset { Stream = stream, ETag = etag, ContentEncoding = "gzip" };
                return true;
            }

            asset = new ScalarStaticAsset { Stream = new GZipStream(stream, CompressionMode.Decompress), ETag = etag };
            return true;
        }

        resourceName = $"{ResourcePrefix}Uncompressed.{fileName}";
        stream = Assembly.GetManifestResourceStream(resourceName);
        if (stream is not null)
        {
            var etag = ETagCache.GetOrAdd(resourceName, static name => ComputeETag(name));
            asset = new ScalarStaticAsset { Stream = stream, ETag = etag };
            return true;
        }
#else
        // Debug builds embed uncompressed assets.
        if (stream is not null)
        {
            _ = gzipAccepted;
            var etag = ETagCache.GetOrAdd(resourceName, static name => ComputeETag(name));
            asset = new ScalarStaticAsset { Stream = stream, ETag = etag };
            return true;
        }
#endif
        asset = default;
        return false;
    }

    private static string ComputeETag(string resourceName)
    {
        using var stream = Assembly.GetManifestResourceStream(resourceName)!;
        var hash = SHA256.HashData(ReadAllBytes(stream));
        // A short, stable, content-based tag is enough to drive 304 handling.
        return $"\"{Convert.ToHexString(hash, 0, 8).ToLowerInvariant()}\"";
    }

    private static byte[] ReadAllBytes(Stream stream)
    {
        if (stream is MemoryStream ms)
        {
            return ms.ToArray();
        }

        using var buffer = new MemoryStream();
        stream.CopyTo(buffer);
        return buffer.ToArray();
    }
}
#endif
