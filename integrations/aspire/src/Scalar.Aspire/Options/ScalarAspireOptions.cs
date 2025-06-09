namespace Scalar.Aspire;

public sealed class ScalarAspireOptions : ScalarOptions
{
    public bool DefaultProxy { get; set; } = true;

    public string CdnUrl { get; set; } = "standalone.js";
}