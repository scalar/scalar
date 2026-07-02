namespace Scalar.Azure.Functions;

/// <summary>
/// Describes the embedded static assets served alongside the Scalar API reference.
/// </summary>
internal static class ScalarAssets
{
    /// <summary>The standalone API reference bundle.</summary>
    internal const string StandaloneFile = "scalar.js";

    /// <summary>The integration helper script that bootstraps the reference.</summary>
    internal const string HelperFile = "scalar.azure.functions.js";

    /// <summary>The favicon used by the reference.</summary>
    internal const string FaviconFile = "favicon.svg";

    /// <summary>
    /// Resolves the content type for a known static asset.
    /// </summary>
    /// <param name="fileName">The requested file name.</param>
    /// <param name="contentType">The resolved content type when the method returns <c>true</c>.</param>
    /// <returns><c>true</c> if the file name maps to a known asset; otherwise <c>false</c>.</returns>
    internal static bool TryGetContentType(string fileName, out string contentType)
    {
        switch (fileName)
        {
            case StandaloneFile:
            case HelperFile:
                contentType = "text/javascript";
                return true;
            case FaviconFile:
                contentType = "image/svg+xml";
                return true;
            default:
                contentType = string.Empty;
                return false;
        }
    }
}
