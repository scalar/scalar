namespace Scalar.AspNetCore;

/// <summary>
/// Represents a document in the Scalar API Reference.
/// </summary>
/// <param name="Name">The name of the document.</param>
/// <param name="Title">The optional title of the document.</param>
/// <param name="RoutePattern">The optional OpenAPI route pattern of the document.</param>
/// <param name="IsDefault">Indicates whether this document is the default document.</param>
/// <remarks>By default, the <see cref="ScalarOptions.OpenApiRoutePattern"/> is used to determine the full OpenAPI document URL.</remarks>
public sealed record ScalarDocument(string Name, string? Title = null, string? RoutePattern = null, bool IsDefault = false);