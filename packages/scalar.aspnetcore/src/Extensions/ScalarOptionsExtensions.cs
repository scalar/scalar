namespace Scalar.AspNetCore;

public static class ScalarOptionsExtensions
{
    public static ScalarOptions WithTitle(this ScalarOptions options, string title)
    {
        options.Title = title;
        return options;
    }
    
    public static ScalarOptions WithEndpointPrefix(this ScalarOptions options, string prefix)
    {
        options.EndpointPathPrefix = prefix;
        return options;
    }
    
    public static ScalarOptions WithProxyUrl(this ScalarOptions options, string proxyUrl)
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }
    
    public static ScalarOptions WithSidebar(this ScalarOptions options, bool showSidebar)
    {
        options.ShowSidebar = showSidebar;
        return options;
    }
    
    public static ScalarOptions WithModels(this ScalarOptions options, bool showModels)
    {
        options.HideModels = !showModels;
        return options;
    }
    
    public static ScalarOptions WithDownloadButton(this ScalarOptions options, bool showDownloadButton)
    {
        options.HideDownloadButton = !showDownloadButton;
        return options;
    }
    
    public static ScalarOptions WithTestRequestButton(this ScalarOptions options, bool showTestRequestButton)
    {
        options.HideTestRequestButton = !showTestRequestButton;
        return options;
    }
    
    public static ScalarOptions WithDarkMode(this ScalarOptions options, bool darkMode)
    {
        options.DarkMode = darkMode;
        return options;
    }
    
    public static ScalarOptions WithDarkModeToggle(this ScalarOptions options, bool showDarkModeToggle)
    {
        options.HideDarkModeToggle = !showDarkModeToggle;
        return options;
    }
    
    public static ScalarOptions WithSearchHotKey(this ScalarOptions options, string searchHotKey)
    {
        options.SearchHotKey = searchHotKey;
        return options;
    }
    
    public static ScalarOptions WithTheme(this ScalarOptions options, ScalarTheme theme)
    {
        options.Theme = theme;
        return options;
    }
    
    public static ScalarOptions WithDefaultFonts(this ScalarOptions options, bool useDefaultFonts)
    {
        options.DefaultFonts = useDefaultFonts;
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