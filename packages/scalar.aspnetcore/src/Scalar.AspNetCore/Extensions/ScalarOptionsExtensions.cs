using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static class ScalarOptionsExtensions
{
    /// <summary>
    /// Sets the title of the page.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="title">The title to set.</param>
    public static ScalarOptions WithTitle(this ScalarOptions options, string title)
    {
        options.Title = title;
        return options;
    }

    /// <summary>
    /// Sets the favicon path or URL that will be used for the documentation.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="favicon">The path or URL to the favicon.</param>
    public static ScalarOptions WithFavicon(this ScalarOptions options, string favicon)
    {
        options.Favicon = favicon;
        return options;
    }

    /// <summary>
    /// Sets the path prefix to access the documentation.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="prefix">The path prefix to set.</param>
    public static ScalarOptions WithEndpointPrefix(this ScalarOptions options, string prefix)
    {
        options.EndpointPathPrefix = prefix;
        return options;
    }

    /// <summary>
    /// Sets the proxy URL for the API requests.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="proxyUrl">The proxy URL to set.</param>
    public static ScalarOptions WithProxyUrl(this ScalarOptions options, string proxyUrl)
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }

    /// <summary>
    /// Sets whether the sidebar should be shown.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="showSidebar">Whether to show the sidebar.</param>
    public static ScalarOptions WithSidebar(this ScalarOptions options, bool showSidebar)
    {
        options.ShowSidebar = showSidebar;
        return options;
    }

    /// <summary>
    /// Sets whether models should be shown in the sidebar, search, and content.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="showModels">Whether to show models.</param>
    public static ScalarOptions WithModels(this ScalarOptions options, bool showModels)
    {
        options.HideModels = !showModels;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Download OpenAPI Specification" button.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="showDownloadButton">Whether to show the download button.</param>
    public static ScalarOptions WithDownloadButton(this ScalarOptions options, bool showDownloadButton)
    {
        options.HideDownloadButton = !showDownloadButton;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Test Request" button.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="showTestRequestButton">Whether to show the test request button.</param>
    public static ScalarOptions WithTestRequestButton(this ScalarOptions options, bool showTestRequestButton)
    {
        options.HideTestRequestButton = !showTestRequestButton;
        return options;
    }

    /// <summary>
    /// Sets whether dark mode is on or off initially.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="darkMode">Whether dark mode is on or off initially.</param>
    public static ScalarOptions WithDarkMode(this ScalarOptions options, bool darkMode)
    {
        options.DarkMode = darkMode;
        return options;
    }

    /// <summary>
    /// Forces the theme mode to always be the specified state.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="forceThemeMode">The theme mode to force.</param>
    /// <returns></returns>
    public static ScalarOptions WithForceThemeMode(this ScalarOptions options, ThemeMode forceThemeMode)
    {
        options.ForceThemeMode = forceThemeMode;
        return options;
    }

    /// <summary>
    /// Sets whether to show the dark mode toggle.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="showDarkModeToggle">Whether to show the dark mode toggle.</param>
    public static ScalarOptions WithDarkModeToggle(this ScalarOptions options, bool showDarkModeToggle)
    {
        options.HideDarkModeToggle = !showDarkModeToggle;
        return options;
    }

    /// <summary>
    /// Sets custom CSS directly to the component.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="customCss">The custom CSS to set.</param>
    public static ScalarOptions WithCustomCss(this ScalarOptions options, string customCss)
    {
        options.CustomCss = customCss;
        return options;
    }

    /// <summary>
    /// Sets the key used with CTRL/CMD to open the search modal.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="searchHotKey">The search hotkey to set.</param>
    public static ScalarOptions WithSearchHotKey(this ScalarOptions options, string searchHotKey)
    {
        options.SearchHotKey = searchHotKey;
        return options;
    }

    /// <summary>
    /// Sets the color theme.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="theme">The theme to set.</param>
    public static ScalarOptions WithTheme(this ScalarOptions options, ScalarTheme theme)
    {
        options.Theme = theme;
        return options;
    }

    /// <summary>
    /// Sets whether to use the default fonts.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="useDefaultFonts">Whether to use the default fonts.</param>
    public static ScalarOptions WithDefaultFonts(this ScalarOptions options, bool useDefaultFonts)
    {
        options.DefaultFonts = useDefaultFonts;
        return options;
    }

    /// <summary>
    /// Sets whether to open all tags by default.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="useOpenAllTags">Whether to open all tags by default.</param>
    public static ScalarOptions WithDefaultOpenAllTags(this ScalarOptions options, bool useOpenAllTags)
    {
        options.DefaultOpenAllTags = useOpenAllTags;
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="server">The <see cref="ScalarServer" /> to add.</param>
    public static ScalarOptions AddServer(this ScalarOptions options, ScalarServer server)
    {
        options.Servers ??= new List<ScalarServer>();
        options.Servers.Add(server);
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" /> using a URL.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="url">The URL of the server to add.</param>
    public static ScalarOptions AddServer(this ScalarOptions options, string url)
    {
        return options.AddServer(new ScalarServer(url));
    }

    /// <summary>
    /// Adds metadata to the configuration.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="key">The metadata key.</param>
    /// <param name="value">The metadata value.</param>
    public static ScalarOptions AddMetadata(this ScalarOptions options, string key, string value)
    {
        options.Metadata ??= new Dictionary<string, string>();
        options.Metadata.Add(key, value);
        return options;
    }

    /// <summary>
    /// Sets the tag sorter for the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="tagSorter">The <see cref="TagSorter" /> to use.</param>
    public static ScalarOptions WithTagSorter(this ScalarOptions options, TagSorter tagSorter)
    {
        options.TagSorter = tagSorter;
        return options;
    }
    
    /// <summary>
    /// Sets the operation sorter for the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="operationSorter">The <see cref="OperationSorter" /> to use.</param>
    public static ScalarOptions WithOperationSorter(this ScalarOptions options, OperationSorter operationSorter)
    {
        options.OperationSorter = operationSorter;
        return options;
    }

    /// <summary>
    /// Sets the preferred authentication scheme.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="preferredScheme">The preferred authentication scheme.</param>
    public static ScalarOptions WithPreferredScheme(this ScalarOptions options, string preferredScheme)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.PreferredSecurityScheme = preferredScheme;
        return options;
    }

    /// <summary>
    /// Sets the API key authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="apiKeyOptions">The API key options to set.</param>
    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, ApiKeyOptions apiKeyOptions)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.ApiKey = apiKeyOptions;
        return options;
    }

    /// <summary>
    /// Configures the API key authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="configureApiKeyOptions">The action to configure the API key options.</param>
    public static ScalarOptions WithApiKeyAuthentication(this ScalarOptions options, Action<ApiKeyOptions> configureApiKeyOptions)
    {
        var apiKeyOptions = new ApiKeyOptions();
        configureApiKeyOptions(apiKeyOptions);
        return options.WithApiKeyAuthentication(apiKeyOptions);
    }

    /// <summary>
    /// Configures the OAuth2 authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="oauth2Options">The OAuth2 options to set.</param>
    public static ScalarOptions WithOAuth2Authentication(this ScalarOptions options, OAuth2Options oauth2Options)
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.OAuth2 = oauth2Options;
        return options;
    }

    /// <summary>
    /// Configures the OAuth2 authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="configureOAuth2Options">The action to configure the OAuth2 options.</param>
    public static ScalarOptions WithOAuth2Authentication(this ScalarOptions options, Action<OAuth2Options> configureOAuth2Options)
    {
        var oauth2Options = new OAuth2Options();
        configureOAuth2Options(oauth2Options);
        return options.WithOAuth2Authentication(oauth2Options);
    }

    /// <summary>
    /// Sets the default HTTP client.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="target">The target to set.</param>
    /// <param name="client">The client to set.</param>
    public static ScalarOptions WithDefaultHttpClient(this ScalarOptions options, ScalarTarget target, ScalarClient client)
    {
        options.DefaultHttpClient = new KeyValuePair<ScalarTarget, ScalarClient>(target, client);
        return options;
    }

    /// <summary>
    /// Sets the route pattern of the OpenAPI document.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="pattern">The route pattern to set.</param>
    public static ScalarOptions WithOpenApiRoutePattern(this ScalarOptions options, [StringSyntax("Route")] string pattern)
    {
        options.OpenApiRoutePattern = pattern;
        return options;
    }

    /// <summary>
    /// Sets the CDN URL for the API reference.
    /// </summary>
    /// <param name="options"><see cref="ScalarOptions" />.</param>
    /// <param name="url">The CDN URL to set.</param>
    public static ScalarOptions WithCdnUrl(this ScalarOptions options, string url)
    {
        options.CdnUrl = url;
        return options;
    }
}