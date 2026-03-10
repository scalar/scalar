using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Annotation that binds an API resource to the Scalar container.
/// </summary>
/// <param name="Resource">The API resource whose OpenAPI document Scalar should display.</param>
/// <param name="ConfigureOptions">Optional callback to configure per-resource <see cref="ScalarOptions"/>.</param>
/// <param name="BaseDocumentUrl">
/// Controls the base URL prepended to the OpenAPI route pattern.
/// <list type="bullet">
///   <item><see langword="null"/> — the service resource URL (computed from endpoints + options) is used as the base (default).</item>
///   <item><see cref="ReferenceExpression.Empty"/> — no base URL is prepended; the route pattern is used as-is (static file served from the Scalar container).</item>
///   <item>Any other expression — its resolved value is prepended to the route pattern.</item>
/// </list>
/// </param>
internal sealed record ScalarAnnotation(
    IResource Resource,
    Func<ScalarOptions, CancellationToken, Task>? ConfigureOptions,
    ReferenceExpression? BaseDocumentUrl = null) : IResourceAnnotation;