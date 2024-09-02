namespace Scalar.AspNetCore;

public static class ScalarOptionsExtensions
{
    public static ScalarOptions WithTitle(this ScalarOptions options, string title)
    {
        options.Title = title;
        return options;
    }

    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, string preferredScheme, Action<ApiKeyOptions> configure)
    {
        var apiKeyOptions = new ApiKeyOptions();
        configure(apiKeyOptions);
        options.Authentication = new ScalarAuthenticationOptions
        {
            PreferredSecurityScheme = preferredScheme,
            ApiKey = apiKeyOptions
        };
        return options;
    }
    
    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, string preferredScheme, ApiKeyOptions apiKeyOptions)
    {
        options.Authentication = new ScalarAuthenticationOptions
        {
            PreferredSecurityScheme = preferredScheme,
            ApiKey = apiKeyOptions
        };
        return options;
    }
}