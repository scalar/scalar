using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Configuration options for a <see cref="ScalarMockServerResource" />.
/// Exactly one document source must be configured for the mock server to start.
/// </summary>
public sealed class ScalarMockServerOptions
{
    /// <summary>Inline OpenAPI document content (JSON or YAML), passed via <c>OPENAPI_DOCUMENT</c>.</summary>
    internal string? DocumentContent { get; private set; }

    /// <summary>A static URL the mock server fetches the document from, passed via <c>OPENAPI_DOCUMENT_URL</c>.</summary>
    internal string? DocumentUrl { get; private set; }

    /// <summary>
    /// A resolvable URL (for example, another Aspire resource's endpoint) for the document.
    /// Resolved at runtime and passed via <c>OPENAPI_DOCUMENT_URL</c>.
    /// </summary>
    internal ReferenceExpression? DocumentUrlExpression { get; private set; }

    /// <summary>Whether any document source has been configured.</summary>
    internal bool HasDocument => DocumentContent is not null || DocumentUrl is not null || DocumentUrlExpression is not null;

    /// <summary>
    /// Provides the OpenAPI document inline. The content is embedded into the container's
    /// environment, so no volume mount is required.
    /// </summary>
    /// <param name="content">The raw OpenAPI document (JSON or YAML).</param>
    public ScalarMockServerOptions WithDocument(string content)
    {
        ArgumentNullException.ThrowIfNull(content);
        ClearDocument();
        DocumentContent = content;
        return this;
    }

    /// <summary>
    /// Reads an OpenAPI document from disk at AppHost build time and provides it inline.
    /// </summary>
    /// <param name="path">Path to a local OpenAPI document (JSON or YAML).</param>
    public ScalarMockServerOptions WithDocumentFile(string path)
    {
        ArgumentException.ThrowIfNullOrEmpty(path);
        ClearDocument();
        DocumentContent = File.ReadAllText(path);
        return this;
    }

    /// <summary>
    /// Points the mock server at a URL it fetches the OpenAPI document from on startup.
    /// </summary>
    /// <param name="url">An absolute URL to a reachable OpenAPI document.</param>
    public ScalarMockServerOptions WithDocumentUrl(string url)
    {
        ArgumentException.ThrowIfNullOrEmpty(url);
        ClearDocument();
        DocumentUrl = url;
        return this;
    }

    /// <summary>Sets a resolvable document URL. Used by <c>WithDocumentFrom</c>.</summary>
    internal void WithDocumentExpression(ReferenceExpression expression)
    {
        ClearDocument();
        DocumentUrlExpression = expression;
    }

    private void ClearDocument()
    {
        DocumentContent = null;
        DocumentUrl = null;
        DocumentUrlExpression = null;
    }
}
