namespace Scalar.Aws.Lambda;

public partial class ScalarOptions
{
    /// <summary>
    /// Controls the Amazon API Gateway route prefix used to resolve relative document and configuration URLs.
    /// </summary>
    /// <remarks>
    /// When <c>null</c> (the default), the prefix is auto-detected from the API Gateway stage
    /// (<c>request.RequestContext.Stage</c>), so requests routed through a named stage (e.g. <c>prod</c>) resolve
    /// correctly without the stage segment leaking into the rendered HTML. HTTP APIs do not embed the stage in the
    /// path for the <c>$default</c> stage, so no prefix is applied in that case. Set this explicitly when using a
    /// custom domain base path mapping, which is invisible to <c>RequestContext.Stage</c>.
    /// </remarks>
    public string? RoutePrefix { get; set; }
}
