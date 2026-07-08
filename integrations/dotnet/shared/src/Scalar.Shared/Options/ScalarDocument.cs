#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#elif SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Represents a document in the Scalar API Reference.
/// </summary>
/// <param name="Name">The name of the document.</param>
/// <param name="Title">The optional title of the document.</param>
/// <param name="RoutePattern">
/// The optional route pattern for the document. If not provided, the pattern from <see cref="ScalarOptions"/> is resolved at configuration time
/// based on the <paramref name="DocumentType"/>: <see cref="ScalarOptions.OpenApiRoutePattern"/> for <see cref="DocumentType.OpenApi"/> documents
/// and <see cref="ScalarOptions.AsyncApiRoutePattern"/> for <see cref="DocumentType.AsyncApi"/> documents.
/// </param>
/// <param name="IsDefault">Indicates whether this document is the default document.</param>
/// <param name="Agent">Optional Agent Scalar options for this document (e.g. API key).</param>
/// <param name="DocumentType">The type of the document (default: <see cref="DocumentType.OpenApi"/>).</param>
public sealed record ScalarDocument(string Name, string? Title = null, string? RoutePattern = null, bool IsDefault = false, ScalarAgentOptions? Agent = null, DocumentType DocumentType = DocumentType.OpenApi);