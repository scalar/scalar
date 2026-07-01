namespace Scalar.Azure.Functions;

/// <summary>
/// Hosting-agnostic request dispatcher. Given the resolved options and the relevant request information it decides
/// whether to render the reference page, serve a static asset, redirect to the trailing slash, or return 404/304.
/// </summary>
internal static class ScalarRequestProcessor
{
    /// <summary>
    /// Processes a Scalar request and produces a <see cref="ScalarRenderResult" />.
    /// </summary>
    /// <param name="options">The resolved options. Document mutation is performed in place, mirroring ASP.NET Core behavior.</param>
    /// <param name="requestPath">The full request path, e.g. <c>/api/scalar/</c>.</param>
    /// <param name="routeRemainder">The catch-all route value (the part after the endpoint prefix), or <c>null</c>.</param>
    /// <param name="gzipAccepted">Whether the client accepts gzip-encoded responses.</param>
    /// <param name="ifNoneMatch">The value of the <c>If-None-Match</c> request header, or <c>null</c>.</param>
    internal static ScalarRenderResult Process(ScalarOptions options, string requestPath, string? routeRemainder, bool gzipAccepted, string? ifNoneMatch)
    {
        var remainder = routeRemainder?.Trim('/');

        // Static asset request (e.g. scalar/scalar.js).
        if (!string.IsNullOrEmpty(remainder) && ScalarAssets.TryGetContentType(remainder, out var contentType))
        {
            if (!ScalarStaticAssets.TryGetAsset(remainder, gzipAccepted, out var staticAsset))
            {
                return new ScalarRenderResult { StatusCode = 404 };
            }

            if (!string.IsNullOrEmpty(ifNoneMatch) && ifNoneMatch == staticAsset.ETag)
            {
                staticAsset.Stream.Dispose();
                return new ScalarRenderResult
                {
                    StatusCode = 304,
                    NotModified = true,
                    ETag = staticAsset.ETag,
                    CacheControl = "no-cache",
                    VaryAcceptEncoding = true
                };
            }

            return new ScalarRenderResult
            {
                StatusCode = 200,
                AssetStream = staticAsset.Stream,
                ContentType = contentType,
                ETag = staticAsset.ETag,
                ContentEncoding = staticAsset.ContentEncoding,
                CacheControl = "no-cache",
                VaryAcceptEncoding = true
            };
        }

        // Index request without a trailing slash: redirect so relative asset URLs resolve correctly
        // (e.g. /api/scalar -> /api/scalar/). The redirect is relative, matching the ASP.NET Core integration.
        if (string.IsNullOrEmpty(remainder) && !requestPath.EndsWith('/'))
        {
            var lastSlashIndex = requestPath.LastIndexOf('/');
            if (lastSlashIndex != -1)
            {
                return new ScalarRenderResult
                {
                    StatusCode = 302,
                    RedirectLocation = $"{requestPath[(lastSlashIndex + 1)..]}/"
                };
            }
        }

        // If a document name is provided as route value, use it as the single document.
        if (!string.IsNullOrEmpty(remainder))
        {
            options.Documents.Clear();
            options.AddDocument(remainder);
        }
        // Otherwise fall back to the default document name.
        else if (options.Documents.Count == 0)
        {
            options.AddDocument("v1");
        }

        // Auto-generated values win when both are set — a per-request nonce is the secure path.
        var nonce = options.DynamicNonce ? ScalarNonce.Generate() : options.Nonce;
        var clientRequestPath = GetClientRequestPath(options, requestPath);
        var html = ScalarHtmlBuilder.BuildIndexHtml(options, clientRequestPath, nonce, ScalarAssets.HelperFile, ScalarAssets.StandaloneFile);

        return new ScalarRenderResult
        {
            StatusCode = 200,
            Html = html,
            ContentType = "text/html",
            Nonce = string.IsNullOrWhiteSpace(nonce) ? null : nonce,
            // Prevent intermediaries and browsers from replaying a one-time nonce to another client.
            CacheControl = string.IsNullOrWhiteSpace(nonce) ? null : "no-store"
        };
    }

    private static string GetClientRequestPath(ScalarOptions options, string requestPath)
    {
        var routePrefix = options.RoutePrefix?.Trim('/');
        if (string.IsNullOrEmpty(routePrefix))
        {
            return requestPath;
        }

        var routePrefixPath = $"/{routePrefix}";
        if (requestPath.Equals(routePrefixPath, StringComparison.OrdinalIgnoreCase))
        {
            return "/";
        }

        return requestPath.StartsWith($"{routePrefixPath}/", StringComparison.OrdinalIgnoreCase)
            ? requestPath[routePrefixPath.Length..]
            : requestPath;
    }
}
