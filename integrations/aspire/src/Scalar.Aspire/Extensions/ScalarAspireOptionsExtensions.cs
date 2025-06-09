namespace Scalar.Aspire;

public static class ScalarAspireOptionsExtensions
{
    public static ScalarAspireOptions WithCdnUrl(this ScalarAspireOptions options, string cdnUrl)
    {
        options.CdnUrl = cdnUrl;
        return options;
    }

    public static ScalarAspireOptions DisableDefaultProxy(this ScalarAspireOptions options)
    {
        options.DefaultProxy = false;
        return options;
    }
}