using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static partial class ScalarOptionsExtensions
{
    /// <summary>
    /// Sets whether HTTPS should be preferred over HTTP when both are available.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    public static TOptions PreferHttpsEndpoint<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.PreferHttpsEndpoint = true;
        return options;
    }

    /// <summary>
    /// Sets the base URL expression used to resolve the OpenAPI document URL.
    /// The expression is evaluated at startup when all endpoint addresses are known.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="baseDocumentUrl">
    /// A <see cref="ReferenceExpression"/> whose resolved value is prepended to relative OpenAPI document URLs.
    /// Use <see cref="ReferenceExpression.Empty"/> so that the <see cref="ScalarOptions.OpenApiRoutePattern"/> is
    /// used as-is (for example, when the document is served as a static file from the Scalar container).
    /// Pass <c>null</c> to fall back to the service resource URL discovered via Aspire service discovery (the default behavior).
    /// </param>
    /// <returns>The options instance so that additional calls can be chained.</returns>
    public static TOptions WithBaseDocumentUrl<TOptions>(this TOptions options, ReferenceExpression? baseDocumentUrl) where TOptions : ScalarOptions
    {
        options.BaseDocumentUrl = baseDocumentUrl;
        return options;
    }
}