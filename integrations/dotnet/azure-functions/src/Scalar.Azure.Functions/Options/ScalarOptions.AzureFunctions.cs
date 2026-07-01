namespace Scalar.Azure.Functions;

public partial class ScalarOptions
{
    /// <summary>
    /// Controls the Azure Functions HTTP route prefix configured in <c>host.json</c>.
    /// </summary>
    /// <remarks>
    /// Azure Functions prefixes HTTP triggers with <c>api</c> by default. Scalar uses this value to resolve relative
    /// document and configuration URLs against the same route prefix. Set this to <c>null</c> or an empty string when
    /// the host route prefix is disabled.
    /// </remarks>
    public string? RoutePrefix { get; set; } = "api";
}
