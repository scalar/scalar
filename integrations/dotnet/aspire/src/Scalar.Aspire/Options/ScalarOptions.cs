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
}