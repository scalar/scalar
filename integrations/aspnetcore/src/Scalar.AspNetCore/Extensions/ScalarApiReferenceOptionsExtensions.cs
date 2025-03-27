using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// 
/// </summary>
public static partial class ScalarOptionsExtensions
{
    /// <summary>
    /// Sets the favicon path or URL that will be used for the documentation.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="favicon">The path or URL to the favicon.</param>
    public static TOptions WithFavicon<TOptions>(this TOptions options, string favicon) where TOptions : ScalarApiReferenceOptions
    {
        options.Favicon = favicon;
        return options;
    }

    /// <summary>
    /// Adds the specified OpenAPI document to the Scalar API reference.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="documentName">The name identifier for the OpenAPI document. This value will be used to replace the '{documentName}' placeholder in the <see cref="ScalarApiReferenceOptions.OpenApiRoutePattern" />.</param>
    /// <param name="title">Optional display title for the document. If not provided, the document name will be used as the title.</param>
    /// <param name="routePattern">Optional route pattern for the OpenAPI document. If not provided, the <see cref="ScalarApiReferenceOptions.OpenApiRoutePattern" /> will be used. The pattern can include the '{documentName}' placeholder which will be replaced with the document name.</param>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// The '{documentName}' placeholder in the route pattern will be replaced with the provided document name.
    /// </remarks>
    public static TOptions AddDocument<TOptions>(this TOptions options, string documentName, string? title = null, string? routePattern = null) where TOptions : ScalarApiReferenceOptions
    {
        options.Documents.Add(new ScalarDocument(documentName, title, routePattern));
        return options;
    }

    /// <summary>
    /// Adds the specified OpenAPI documents to the Scalar API reference.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="documentNames">The name identifiers for the OpenAPI documents.</param>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static TOptions AddDocuments<TOptions>(this TOptions options, params IEnumerable<string> documentNames) where TOptions : ScalarApiReferenceOptions
    {
        var documents = documentNames.Select(documentName => new ScalarDocument(documentName));
        options.Documents.AddRange(documents);
        return options;
    }

    /// <summary>
    /// Adds the specified OpenAPI documents to the Scalar API reference.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="documents">A list of <see cref="ScalarDocument" />`s to add.</param>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static TOptions AddDocuments<TOptions>(this TOptions options, params IEnumerable<ScalarDocument> documents) where TOptions : ScalarApiReferenceOptions
    {
        options.Documents.AddRange(documents);
        return options;
    }

    /// <summary>
    /// Sets the proxy URL for the API requests.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="proxyUrl">The proxy URL to set.</param>
    public static TOptions WithProxyUrl<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string proxyUrl) where TOptions : ScalarApiReferenceOptions
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }

    /// <summary>
    /// Sets whether the sidebar should be shown.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="showSidebar">Whether to show the sidebar.</param>
    public static TOptions WithSidebar<TOptions>(this TOptions options, bool showSidebar) where TOptions : ScalarApiReferenceOptions
    {
        options.ShowSidebar = showSidebar;
        return options;
    }

    /// <summary>
    /// Sets whether models should be shown in the sidebar, search, and content.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="showModels">Whether to show models.</param>
    public static TOptions WithModels<TOptions>(this TOptions options, bool showModels) where TOptions : ScalarApiReferenceOptions
    {
        options.HideModels = !showModels;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Download OpenAPI Specification" button.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="showDownloadButton">Whether to show the download button.</param>
    public static TOptions WithDownloadButton<TOptions>(this TOptions options, bool showDownloadButton) where TOptions : ScalarApiReferenceOptions
    {
        options.HideDownloadButton = !showDownloadButton;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Test Request" button.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="showTestRequestButton">Whether to show the test request button.</param>
    public static TOptions WithTestRequestButton<TOptions>(this TOptions options, bool showTestRequestButton) where TOptions : ScalarApiReferenceOptions
    {
        options.HideTestRequestButton = !showTestRequestButton;
        return options;
    }

    /// <summary>
    /// Sets whether dark mode is on or off initially.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="darkMode">Whether dark mode is on or off initially.</param>
    public static TOptions WithDarkMode<TOptions>(this TOptions options, bool darkMode) where TOptions : ScalarApiReferenceOptions
    {
        options.DarkMode = darkMode;
        return options;
    }

    /// <summary>
    /// Forces the theme mode to always be the specified state.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="forceThemeMode">The theme mode to force.</param>
    public static TOptions WithForceThemeMode<TOptions>(this TOptions options, ThemeMode forceThemeMode) where TOptions : ScalarApiReferenceOptions
    {
        options.ForceThemeMode = forceThemeMode;
        return options;
    }

    /// <summary>
    /// Sets whether to show the dark mode toggle.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="showDarkModeToggle">Whether to show the dark mode toggle.</param>
    public static TOptions WithDarkModeToggle<TOptions>(this TOptions options, bool showDarkModeToggle) where TOptions : ScalarApiReferenceOptions
    {
        options.HideDarkModeToggle = !showDarkModeToggle;
        return options;
    }

    /// <summary>
    /// Sets custom CSS directly to the component.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="customCss">The custom CSS to set.</param>
    public static TOptions WithCustomCss<TOptions>(this TOptions options, [StringSyntax("css")] string customCss) where TOptions : ScalarApiReferenceOptions
    {
        options.CustomCss = customCss;
        return options;
    }

    /// <summary>
    /// Sets the key used with CTRL/CMD to open the search modal.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="searchHotKey">The search hotkey to set.</param>
    public static TOptions WithSearchHotKey<TOptions>(this TOptions options, string searchHotKey) where TOptions : ScalarApiReferenceOptions
    {
        options.SearchHotKey = searchHotKey;
        return options;
    }

    /// <summary>
    /// Sets the color theme.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="theme">The theme to set.</param>
    public static TOptions WithTheme<TOptions>(this TOptions options, ScalarTheme theme) where TOptions : ScalarApiReferenceOptions
    {
        options.Theme = theme;
        return options;
    }

    /// <summary>
    /// Sets the layout for the Scalar API reference.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="layout">The layout to use.</param>
    public static TOptions WithLayout<TOptions>(this TOptions options, ScalarLayout layout) where TOptions : ScalarApiReferenceOptions
    {
        options.Layout = layout;
        return options;
    }

    /// <summary>
    /// Sets whether to use the default fonts.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="useDefaultFonts">Whether to use the default fonts.</param>
    public static TOptions WithDefaultFonts<TOptions>(this TOptions options, bool useDefaultFonts) where TOptions : ScalarApiReferenceOptions
    {
        options.DefaultFonts = useDefaultFonts;
        return options;
    }

    /// <summary>
    /// Sets whether to open all tags by default.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="useOpenAllTags">Whether to open all tags by default.</param>
    public static TOptions WithDefaultOpenAllTags<TOptions>(this TOptions options, bool useOpenAllTags) where TOptions : ScalarApiReferenceOptions
    {
        options.DefaultOpenAllTags = useOpenAllTags;
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarApiReferenceOptions" />.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="server">The <see cref="ScalarServer" /> to add.</param>
    public static TOptions AddServer<TOptions>(this TOptions options, ScalarServer server) where TOptions : ScalarApiReferenceOptions
    {
        options.Servers ??= new List<ScalarServer>();
        options.Servers.Add(server);
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarApiReferenceOptions" /> using a URL.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="url">The URL of the server to add.</param>
    public static TOptions AddServer<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url) where TOptions : ScalarApiReferenceOptions => options.AddServer(new ScalarServer(url));

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarApiReferenceOptions" /> using a URL and description.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="url">The URL of the server to add.</param>
    /// <param name="description">The description of the server.</param>
    public static TOptions AddServer<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url, string description) where TOptions : ScalarApiReferenceOptions =>
        options.AddServer(new ScalarServer(url, description));

    /// <summary>
    /// Adds metadata to the configuration.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="key">The metadata key.</param>
    /// <param name="value">The metadata value.</param>
    public static TOptions AddMetadata<TOptions>(this TOptions options, string key, string value) where TOptions : ScalarApiReferenceOptions
    {
        options.Metadata ??= new Dictionary<string, string>();
        options.Metadata.Add(key, value);
        return options;
    }

    /// <summary>
    /// Sets the tag sorter for the <see cref="ScalarApiReferenceOptions" />.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="tagSorter">The <see cref="TagSorter" /> to use.</param>
    public static TOptions WithTagSorter<TOptions>(this TOptions options, TagSorter tagSorter) where TOptions : ScalarApiReferenceOptions
    {
        options.TagSorter = tagSorter;
        return options;
    }

    /// <summary>
    /// Sets the operation sorter for the <see cref="ScalarApiReferenceOptions" />.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="operationSorter">The <see cref="OperationSorter" /> to use.</param>
    public static TOptions WithOperationSorter<TOptions>(this TOptions options, OperationSorter operationSorter) where TOptions : ScalarApiReferenceOptions
    {
        options.OperationSorter = operationSorter;
        return options;
    }

    /// <summary>
    /// Sets the preferred authentication scheme.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="preferredScheme">The preferred authentication scheme.</param>
    public static TOptions WithPreferredScheme<TOptions>(this TOptions options, string preferredScheme) where TOptions : ScalarApiReferenceOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.PreferredSecurityScheme = preferredScheme;
        return options;
    }

    /// <summary>
    /// Sets the API key authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="apiKeyOptions">The API key options to set.</param>
    public static TOptions WithApiKeyAuthentication<TOptions>(this TOptions options, ApiKeyOptions apiKeyOptions) where TOptions : ScalarApiReferenceOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.ApiKey = apiKeyOptions;
        return options;
    }

    /// <summary>
    /// Configures the API key authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="configureApiKeyOptions">The action to configure the API key options.</param>
    public static TOptions WithApiKeyAuthentication<TOptions>(this TOptions options, Action<ApiKeyOptions> configureApiKeyOptions) where TOptions : ScalarApiReferenceOptions
    {
        var apiKeyOptions = new ApiKeyOptions();
        configureApiKeyOptions(apiKeyOptions);
        return options.WithApiKeyAuthentication(apiKeyOptions);
    }

    /// <summary>
    /// Configures the OAuth2 authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="oauth2Options">The OAuth2 options to set.</param>
    public static TOptions WithOAuth2Authentication<TOptions>(this TOptions options, OAuth2Options oauth2Options) where TOptions : ScalarApiReferenceOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.OAuth2 = oauth2Options;
        return options;
    }

    /// <summary>
    /// Configures the OAuth2 authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="configureOAuth2Options">The action to configure the OAuth2 options.</param>
    public static TOptions WithOAuth2Authentication<TOptions>(this TOptions options, Action<OAuth2Options> configureOAuth2Options) where TOptions : ScalarApiReferenceOptions
    {
        var oauth2Options = new OAuth2Options();
        configureOAuth2Options(oauth2Options);
        return options.WithOAuth2Authentication(oauth2Options);
    }

    /// <summary>
    /// Sets the HTTP basic authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="httpBasicOptions">The HTTP basic options to set.</param>
    public static TOptions WithHttpBasicAuthentication<TOptions>(this TOptions options, HttpBasicOptions httpBasicOptions) where TOptions : ScalarApiReferenceOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.Http ??= new HttpOptions();
        options.Authentication.Http.Basic = httpBasicOptions;
        return options;
    }

    /// <summary>
    /// Configures the HTTP basic authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="configureHttpBasicOptions">The action to configure the HTTP basic options.</param>
    public static TOptions WithHttpBasicAuthentication<TOptions>(this TOptions options, Action<HttpBasicOptions> configureHttpBasicOptions) where TOptions : ScalarApiReferenceOptions
    {
        var httpBasicOptions = new HttpBasicOptions();
        configureHttpBasicOptions(httpBasicOptions);
        return options.WithHttpBasicAuthentication(httpBasicOptions);
    }

    /// <summary>
    /// Sets the HTTP bearer authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="httpBearerOptions">The HTTP bearer options to set.</param>
    public static TOptions WithHttpBearerAuthentication<TOptions>(this TOptions options, HttpBearerOptions httpBearerOptions) where TOptions : ScalarApiReferenceOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.Http ??= new HttpOptions();
        options.Authentication.Http.Bearer = httpBearerOptions;
        return options;
    }

    /// <summary>
    /// Configures the HTTP bearer authentication options.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="configureHttpBearerOptions">The action to configure the HTTP bearer options.</param>
    public static TOptions WithHttpBearerAuthentication<TOptions>(this TOptions options, Action<HttpBearerOptions> configureHttpBearerOptions) where TOptions : ScalarApiReferenceOptions
    {
        var httpBearerOptions = new HttpBearerOptions();
        configureHttpBearerOptions(httpBearerOptions);
        return options.WithHttpBearerAuthentication(httpBearerOptions);
    }

    /// <summary>
    /// Sets the default HTTP client.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="target">The target to set.</param>
    /// <param name="client">The client to set.</param>
    public static TOptions WithDefaultHttpClient<TOptions>(this TOptions options, ScalarTarget target, ScalarClient client) where TOptions : ScalarApiReferenceOptions
    {
        options.DefaultHttpClient = new KeyValuePair<ScalarTarget, ScalarClient>(target, client);
        return options;
    }

    /// <summary>
    /// Sets the route pattern of the OpenAPI document.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="pattern">The route pattern to set.</param>
    public static TOptions WithOpenApiRoutePattern<TOptions>(this TOptions options, [StringSyntax("Route")] string pattern) where TOptions : ScalarApiReferenceOptions
    {
        options.OpenApiRoutePattern = pattern;
        return options;
    }

    /// <summary>
    /// Sets whether to expose 'dotnet' to the configuration.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="expose">Whether to expose 'dotnet'.</param>
    public static TOptions WithDotNetFlag<TOptions>(this TOptions options, bool expose) where TOptions : ScalarApiReferenceOptions
    {
        options.DotNetFlag = expose;
        return options;
    }

    /// <summary>
    /// Sets whether the client button from the reference sidebar should be shown.
    /// </summary>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="showButton">Whether to show the client button.</param>
    public static TOptions WithClientButton<TOptions>(this TOptions options, bool showButton) where TOptions : ScalarApiReferenceOptions
    {
        options.HideClientButton = !showButton;
        return options;
    }

    /// <summary>
    /// Sets the base server URL that will be used to prefix all relative OpenAPI server URLs.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    /// <param name="options"><see cref="ScalarApiReferenceOptions" />.</param>
    /// <param name="baseServerUrl">The base server URL to add.</param>
    /// <remarks>
    /// When specified, this URL will be prepended to all relative server URLs defined in the OpenAPI document.
    /// For example, if BaseServerUrl is "https://api.example.com" and a server URL in the OpenAPI document is
    /// "/api", the resulting URL will be "https://api.example.com/api". This only affects relative server URLs;
    /// absolute URLs remain unchanged.
    /// </remarks>
    public static TOptions WithBaseServerUrl<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string baseServerUrl) where TOptions : ScalarApiReferenceOptions
    {
        options.BaseServerUrl = baseServerUrl;
        return options;
    }
}