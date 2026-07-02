namespace Scalar.Azure.Functions;

/// <summary>
/// A hosting-agnostic description of the response that should be written for a Scalar request.
/// Adapters translate this into the concrete response type of each Azure Functions HTTP model.
/// </summary>
internal sealed class ScalarRenderResult
{
    /// <summary>The HTTP status code to emit.</summary>
    public int StatusCode { get; init; } = 200;

    /// <summary>When set, the response is a redirect to this (possibly relative) location.</summary>
    public string? RedirectLocation { get; init; }

    /// <summary>When <c>true</c>, the response is a <c>304 Not Modified</c>.</summary>
    public bool NotModified { get; init; }

    /// <summary>The HTML body to write, when the request resolves to the reference page.</summary>
    public string? Html { get; init; }

    /// <summary>The asset stream to write, when the request resolves to a static asset. The adapter disposes it.</summary>
    public Stream? AssetStream { get; init; }

    /// <summary>The content type for the body.</summary>
    public string? ContentType { get; init; }

    /// <summary>A content-based entity tag (already quoted).</summary>
    public string? ETag { get; init; }

    /// <summary>The content encoding to advertise (e.g. <c>gzip</c>).</summary>
    public string? ContentEncoding { get; init; }

    /// <summary>The <c>Cache-Control</c> value to emit, if any.</summary>
    public string? CacheControl { get; init; }

    /// <summary>Whether to emit <c>Vary: Accept-Encoding</c>.</summary>
    public bool VaryAcceptEncoding { get; init; }

    /// <summary>The effective nonce, exposed so adapters can surface it (e.g. via <c>HttpContext.Items</c>).</summary>
    public string? Nonce { get; init; }
}
