using System.Diagnostics.CodeAnalysis;

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
    
    public static ScalarOptions WithCustomCss(this ScalarOptions options, string customCss)
    {
        options.CustomCss = customCss;
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

    public static ScalarOptions WithDefaultOpenAllTags(this ScalarOptions options, bool useOpenAllTags)
    {
        options.DefaultOpenAllTags = useOpenAllTags;
        return options;
    }

    public static ScalarOptions AddMetadata(this ScalarOptions options, string key, string value)
    {
        options.Metadata ??= new Dictionary<string, string>();
        options.Metadata.Add(key, value);
        return options;
    }

    public static ScalarOptions WithPreferredScheme(this ScalarOptions options, string preferredScheme)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.PreferredSecurityScheme = preferredScheme;
        return options;
    }

    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, ApiKeyOptions apiKeyOptions)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.ApiKey = apiKeyOptions;
        return options;
    }

    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, Action<ApiKeyOptions> configureApiKeyOptions)
    {
        var apiKeyOptions = new ApiKeyOptions();
        configureApiKeyOptions(apiKeyOptions);
        return options.WithApiKeyAuthentication(apiKeyOptions);
    }

    public static ScalarOptions WithDefaultHttpClient(this ScalarOptions options, ScalarTarget target, ScalarClient client)
    {
        options.DefaultHttpClient = new KeyValuePair<ScalarTarget, ScalarClient>(target, client);
        return options;
    }

    public static ScalarOptions WithOpenApiRoutePattern(this ScalarOptions options, [StringSyntax("Route")] string pattern)
    {
        options.OpenApiRoutePattern = pattern;
        return options;
    }

    public static ScalarOptions WithCdnUrl(this ScalarOptions options, string url)
    {
        options.CdnUrl = url;
        return options;
    }
}