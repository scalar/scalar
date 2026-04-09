using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

public partial class ScalarOptions
{
    /// <summary>
    /// Controls whether HTTPS should be preferred over HTTP when both are available.
    /// </summary>
    /// <remarks>
    /// When set to <c>true</c>, HTTPS URLs will be prioritized when multiple endpoints are available.
    /// </remarks>
    public bool PreferHttpsEndpoint { get; set; }

    /// <summary>
    /// Controls the base URL expression used to resolve the OpenAPI document URL.
    /// </summary>
    /// <remarks>
    /// This expression is evaluated at startup inside <c>ScalarResourceConfigurator</c>, when all endpoint
    /// addresses are known. When the expression evaluates to a non-empty string it is prepended to the relative
    /// <see cref="OpenApiRoutePattern"/>. When the expression evaluates to <c>null</c> or an empty string
    /// the pattern is used as-is (useful when the document is served directly from the Scalar container,
    /// for example as a static file). When this property is <c>null</c> (the default), the service resource
    /// URL discovered via Aspire service discovery is used as the base.
    /// </remarks>
    public ReferenceExpression? BaseDocumentUrl { get; set; }
}