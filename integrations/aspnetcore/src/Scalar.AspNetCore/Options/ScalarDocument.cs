namespace Scalar.AspNetCore;

/// <summary>
/// Represents a document in the Scalar API Reference.
/// </summary>
/// <param name="Name">The name of the document.</param>
/// <param name="Title">The optional title of the document.</param>
public sealed record ScalarDocument(string Name, string? Title = null);