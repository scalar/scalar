using System.Diagnostics.CodeAnalysis;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static partial class ScalarOptionsExtensions
{
    /// <summary>
    /// Controls the path or URL to a favicon for the documentation.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="favicon">The path or URL to the favicon.</param>
    public static TOptions WithFavicon<TOptions>(this TOptions options, string favicon) where TOptions : ScalarOptions
    {
        options.Favicon = favicon;
        return options;
    }

    /// <summary>
    /// Adds an OpenAPI document to the Scalar API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="documentName">The name identifier for the OpenAPI document. This value will be used to replace the '{documentName}' placeholder in the <see cref="ScalarOptions.OpenApiRoutePattern"/>.</param>
    /// <param name="title">Optional display title for the document. If not provided, the document name will be used as the title.</param>
    /// <param name="routePattern">Optional route pattern for the OpenAPI document. If not provided, the <see cref="ScalarOptions.OpenApiRoutePattern"/> will be used. The pattern can include the '{documentName}' placeholder which will be replaced with the document name.</param>
    /// <param name="isDefault">Indicates whether this document should be the default selection when multiple documents are available. Only one document should be marked as default.</param>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static TOptions AddDocument<TOptions>(this TOptions options, string documentName, string? title = null, string? routePattern = null, bool isDefault = false) where TOptions : ScalarOptions
    {
        options.Documents.Add(new ScalarDocument(documentName, title, routePattern, isDefault));
        return options;
    }

    /// <summary>
    /// Adds multiple OpenAPI documents to the Scalar API Reference using document names.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="documentNames">The name identifiers for the OpenAPI documents.</param>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static TOptions AddDocuments<TOptions>(this TOptions options, params IEnumerable<string> documentNames) where TOptions : ScalarOptions
    {
        var documents = documentNames.Select(documentName => new ScalarDocument(documentName));
        options.Documents.AddRange(documents);
        return options;
    }

    /// <summary>
    /// Adds multiple OpenAPI documents to the Scalar API Reference using document objects.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="documents">A list of <see cref="ScalarDocument" />s to add.</param>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static TOptions AddDocuments<TOptions>(this TOptions options, params IEnumerable<ScalarDocument> documents) where TOptions : ScalarOptions
    {
        options.Documents.AddRange(documents);
        return options;
    }

    /// <summary>
    /// Controls the proxy URL for API requests.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="proxyUrl">The proxy URL to set.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use WithProxy() instead.")]
    public static TOptions WithProxyUrl<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string proxyUrl) where TOptions : ScalarOptions
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }

    /// <summary>
    /// Sets whether the sidebar should be shown.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showSidebar">Whether to show the sidebar.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use HideSidebar() instead. Note: WithSidebar(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithSidebar<TOptions>(this TOptions options, bool showSidebar = true) where TOptions : ScalarOptions
    {
        options.ShowSidebar = showSidebar;
        return options;
    }

    /// <summary>
    /// Controls whether the sidebar and search use the operation summary or path (default: <see cref="OperationTitleSource.Summary" />).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="operationTitleSource">Whether to use the method summary or the method path in the sidebar and search.</param>
    public static TOptions WithOperationTitleSource<TOptions>(this TOptions options, OperationTitleSource operationTitleSource) where TOptions : ScalarOptions
    {
        options.OperationTitleSource = operationTitleSource;
        return options;
    }

    /// <summary>
    /// Sets whether models should be shown in the sidebar, search, and content.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showModels">Whether to show models.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use HideModels() instead. Note: WithModels(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithModels<TOptions>(this TOptions options, bool showModels = true) where TOptions : ScalarOptions
    {
        options.HideModels = !showModels;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Download OpenAPI Specification" button.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showDownloadButton">Whether to show the download button.</param>
    [Obsolete($"This method is obsolete and will be removed in a future release. Use '{nameof(WithDocumentDownloadType)}' instead.")]
    public static TOptions WithDownloadButton<TOptions>(this TOptions options, bool showDownloadButton = true) where TOptions : ScalarOptions
    {
        options.HideDownloadButton = !showDownloadButton;
        return options;
    }

    /// <summary>
    /// Controls the type of document download available for the API documentation (default: <see cref="DocumentDownloadType.Both" />).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="documentDownloadType">The document download type to set.</param>
    public static TOptions WithDocumentDownloadType<TOptions>(this TOptions options, DocumentDownloadType documentDownloadType) where TOptions : ScalarOptions
    {
        options.DocumentDownloadType = documentDownloadType;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Test Request" button.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showTestRequestButton">Whether to show the test request button.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use HideTestRequestButton() instead. Note: WithTestRequestButton(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithTestRequestButton<TOptions>(this TOptions options, bool showTestRequestButton = true) where TOptions : ScalarOptions
    {
        options.HideTestRequestButton = !showTestRequestButton;
        return options;
    }

    /// <summary>
    /// Sets whether dark mode is on or off initially.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="darkMode">Whether dark mode is on or off initially.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use EnableDarkMode() instead. Note: WithDarkMode(false) is the default behavior and can be removed entirely.")]
    public static TOptions WithDarkMode<TOptions>(this TOptions options, bool darkMode = true) where TOptions : ScalarOptions
    {
        options.DarkMode = darkMode;
        return options;
    }

    /// <summary>
    /// Forces the theme to always be in the specified state.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="forceThemeMode">The theme mode to force.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use ForceLightMode() or ForceDarkMode() instead.")]
    public static TOptions WithForceThemeMode<TOptions>(this TOptions options, ThemeMode forceThemeMode) where TOptions : ScalarOptions
    {
        options.ForceThemeMode = forceThemeMode;
        return options;
    }

    /// <summary>
    /// Sets whether to show the dark mode toggle.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showDarkModeToggle">Whether to show the dark mode toggle.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use HideDarkModeToggle() instead. Note: WithDarkModeToggle(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithDarkModeToggle<TOptions>(this TOptions options, bool showDarkModeToggle = true) where TOptions : ScalarOptions
    {
        options.HideDarkModeToggle = !showDarkModeToggle;
        return options;
    }

    /// <summary>
    /// Controls custom CSS passed directly to the component.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="customCss">The custom CSS to set.</param>
    public static TOptions WithCustomCss<TOptions>(this TOptions options, [StringSyntax("css")] string customCss) where TOptions : ScalarOptions
    {
        options.CustomCss = customCss;
        return options;
    }

    /// <summary>
    /// Controls the key used with CTRL/CMD to open the search modal (default: 'k').
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="searchHotKey">The search hotkey to set.</param>
    /// <remarks>For example, CMD+k or CTRL+k.</remarks>
    public static TOptions WithSearchHotKey<TOptions>(this TOptions options, string searchHotKey) where TOptions : ScalarOptions
    {
        options.SearchHotKey = searchHotKey;
        return options;
    }

    /// <summary>
    /// Controls the color theme (default: <see cref="ScalarTheme.Default" />).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="theme">The theme to set.</param>
    public static TOptions WithTheme<TOptions>(this TOptions options, ScalarTheme theme) where TOptions : ScalarOptions
    {
        options.Theme = theme;
        return options;
    }

    /// <summary>
    /// Sets the layout for the Scalar API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="layout">The layout to use.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use WithClassicLayout() instead. Note: WithLayout(ScalarLayout.Modern) is the default behavior and can be removed entirely.")]
    public static TOptions WithLayout<TOptions>(this TOptions options, ScalarLayout layout) where TOptions : ScalarOptions
    {
        options.Layout = layout;
        return options;
    }

    /// <summary>
    /// Sets whether to use the default fonts.
    /// By default, Inter and JetBrains Mono are used, served by our CDN.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="useDefaultFonts">Whether to use the default fonts.</param>
    /// <remarks>If you use a different font or just don't want to use our CDN, set this to <c>false</c>.</remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use DisableDefaultFonts() instead. Note: WithDefaultFonts(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithDefaultFonts<TOptions>(this TOptions options, bool useDefaultFonts = true) where TOptions : ScalarOptions
    {
        options.DefaultFonts = useDefaultFonts;
        return options;
    }

    /// <summary>
    /// Sets whether all tags should be opened by default.
    /// By default, only the relevant tag based on the URL is opened.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="useOpenAllTags">Whether to open all tags by default.</param>
    /// <remarks>If you want all the tags open by default then set this configuration option.</remarks>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use ExpandAllTags() instead. Note: WithDefaultOpenAllTags(false) is the default behavior and can be removed entirely.")]
    public static TOptions WithDefaultOpenAllTags<TOptions>(this TOptions options, bool useOpenAllTags = true) where TOptions : ScalarOptions
    {
        options.DefaultOpenAllTags = useOpenAllTags;
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="server">The <see cref="ScalarServer" /> to add.</param>
    public static TOptions AddServer<TOptions>(this TOptions options, ScalarServer server) where TOptions : ScalarOptions
    {
        options.Servers ??= new List<ScalarServer>();
        options.Servers.Add(server);
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" /> using a URL.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="url">The URL of the server to add.</param>
    public static TOptions AddServer<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url) where TOptions : ScalarOptions => options.AddServer(new ScalarServer(url));

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" /> using a URL and description.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="url">The URL of the server to add.</param>
    /// <param name="description">The description of the server.</param>
    public static TOptions AddServer<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url, string description) where TOptions : ScalarOptions => options.AddServer(new ScalarServer(url, description));

    /// <summary>
    /// Adds metadata to the configuration.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="key">The metadata key.</param>
    /// <param name="value">The metadata value.</param>
    public static TOptions AddMetadata<TOptions>(this TOptions options, string key, string value) where TOptions : ScalarOptions
    {
        options.Metadata ??= new Dictionary<string, string>();
        options.Metadata.Add(key, value);
        return options;
    }

    /// <summary>
    /// Controls the tag sorter for the Scalar API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="tagSorter">The <see cref="TagSorter" /> to use.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use SortTagsAlphabetically() instead")]
    public static TOptions WithTagSorter<TOptions>(this TOptions options, TagSorter tagSorter) where TOptions : ScalarOptions
    {
        options.TagSorter = tagSorter;
        return options;
    }

    /// <summary>
    /// Controls the operation sorter for the Scalar API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="operationSorter">The <see cref="OperationSorter" /> to use.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use SortOperationsByMethod() instead. Note: WithOperationSorter(OperationSorter.Alpha) is the default behavior and can be removed entirely.")]
    public static TOptions WithOperationSorter<TOptions>(this TOptions options, OperationSorter operationSorter) where TOptions : ScalarOptions
    {
        options.OperationSorter = operationSorter;
        return options;
    }

    /// <summary>
    /// Sets the preferred authentication scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="preferredScheme">The preferred authentication scheme.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Use AddPreferredSecuritySchemes instead.")]
    public static TOptions WithPreferredScheme<TOptions>(this TOptions options, string preferredScheme) where TOptions : ScalarOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.PreferredSecuritySchemes = [preferredScheme];
        return options;
    }

    /// <summary>
    /// Controls one or more preferred security schemes for authentication.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="preferredSchemes">A collection of preferred security schemes.</param>
    public static TOptions AddPreferredSecuritySchemes<TOptions>(this TOptions options, params IEnumerable<string> preferredSchemes) where TOptions : ScalarOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        if (options.Authentication.PreferredSecuritySchemes is null)
        {
            options.Authentication.PreferredSecuritySchemes = [.. preferredSchemes];
            return options;
        }

        options.Authentication.PreferredSecuritySchemes = [.. options.Authentication.PreferredSecuritySchemes, .. preferredSchemes];
        return options;
    }

    /// <summary>
    /// Sets default scopes to be requested for a specific OAuth2 security scheme during authentication.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="scopes">A collection of scopes to request by default.</param>
    /// <remarks>
    /// Default scopes are pre-selected in the UI when the user initiates an OAuth2 authentication flow.
    /// If the specified security scheme does not exist, a new one will be created.
    /// </remarks>
    public static TOptions AddDefaultScopes<TOptions>(this TOptions options, string securitySchemeName, params IEnumerable<string> scopes) where TOptions : ScalarOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.SecuritySchemes ??= new Dictionary<string, ScalarSecurityScheme>();

        if (options.Authentication.SecuritySchemes.TryGetValue(securitySchemeName, out var existingScheme) && existingScheme is ScalarOAuth2SecurityScheme existingOAuth2Scheme)
        {
            existingOAuth2Scheme.DefaultScopes = scopes;
            return options;
        }

        options.Authentication.SecuritySchemes[securitySchemeName] = new ScalarOAuth2SecurityScheme
        {
            DefaultScopes = scopes
        };

        return options;
    }

    /// <summary>
    /// Adds OAuth2 flows for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlows">An action to configure the OAuth2 flows.</param>
    /// <remarks>
    /// This method configures OAuth2 flows for the specified security scheme.
    /// It's a convenience method that calls <see cref="AddOAuth2Authentication"/> and configures the flows property.
    /// </remarks>
    public static TOptions AddOAuth2Flows<TOptions>(this TOptions options, string securitySchemeName, Action<ScalarFlows> configureFlows) where TOptions : ScalarOptions
    {
        options.AddOAuth2Authentication(securitySchemeName, scheme =>
        {
            scheme.Flows ??= new ScalarFlows();
            configureFlows(scheme.Flows);
        });
        return options;
    }

    /// <summary>
    /// Adds OAuth2 authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the OAuth2 security scheme.</param>
    /// <remarks>
    /// This method allows you to configure an OAuth2 security scheme for the specified security scheme name.
    /// If the security scheme already exists and is an OAuth2 scheme, the existing configuration will be updated.
    /// Otherwise, a new OAuth2 security scheme will be created and added to the authentication options.
    /// </remarks>
    public static TOptions AddOAuth2Authentication<TOptions>(this TOptions options, string securitySchemeName, Action<ScalarOAuth2SecurityScheme> configureScheme) where TOptions : ScalarOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.SecuritySchemes ??= new Dictionary<string, ScalarSecurityScheme>();


        // Check if the security scheme already exists
        if (options.Authentication.SecuritySchemes.TryGetValue(securitySchemeName, out var existingScheme) &&
            existingScheme is ScalarOAuth2SecurityScheme existingOAuth2Scheme)
        {
            configureScheme(existingOAuth2Scheme);
            return options;
        }

        var oAuth2Scheme = new ScalarOAuth2SecurityScheme();
        configureScheme(oAuth2Scheme);

        options.Authentication.SecuritySchemes[securitySchemeName] = oAuth2Scheme;

        return options;
    }

    /// <summary>
    /// Adds OAuth2 client credentials authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the flow.</param>
    public static TOptions AddClientCredentialsFlow<TOptions>(this TOptions options, string securitySchemeName, Action<ClientCredentialsFlow> configureFlow) where TOptions : ScalarOptions
    {
        return options.AddOAuth2Flows(securitySchemeName, flows =>
        {
            flows.ClientCredentials ??= new ClientCredentialsFlow();
            configureFlow(flows.ClientCredentials);
        });
    }


    /// <summary>
    /// Adds OAuth2 authorization code authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the flow.</param>
    public static TOptions AddAuthorizationCodeFlow<TOptions>(this TOptions options, string securitySchemeName, Action<AuthorizationCodeFlow> configureFlow) where TOptions : ScalarOptions
    {
        return options.AddOAuth2Flows(securitySchemeName, flows =>
        {
            flows.AuthorizationCode ??= new AuthorizationCodeFlow();
            configureFlow(flows.AuthorizationCode);
        });
    }

    /// <summary>
    /// Adds OAuth2 implicit flow authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the implicit flow.</param>
    public static TOptions AddImplicitFlow<TOptions>(this TOptions options, string securitySchemeName, Action<ImplicitFlow> configureFlow) where TOptions : ScalarOptions
    {
        return options.AddOAuth2Flows(securitySchemeName, flows =>
        {
            flows.Implicit ??= new ImplicitFlow();
            configureFlow(flows.Implicit);
        });
    }

    /// <summary>
    /// Adds OAuth2 password flow authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the password flow.</param>
    public static TOptions AddPasswordFlow<TOptions>(this TOptions options, string securitySchemeName, Action<PasswordFlow> configureFlow) where TOptions : ScalarOptions
    {
        return options.AddOAuth2Flows(securitySchemeName, flows =>
        {
            flows.Password ??= new PasswordFlow();
            configureFlow(flows.Password);
        });
    }

    /// <summary>
    /// Adds API key authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the API key authentication.</param>
    public static TOptions AddApiKeyAuthentication<TOptions>(this TOptions options, string securitySchemeName, Action<ScalarApiKeySecurityScheme> configureScheme) where TOptions : ScalarOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.SecuritySchemes ??= new Dictionary<string, ScalarSecurityScheme>();

        if (options.Authentication.SecuritySchemes.TryGetValue(securitySchemeName, out var existingScheme) && existingScheme is ScalarApiKeySecurityScheme existingHttpScheme)
        {
            configureScheme(existingHttpScheme);
            return options;
        }

        var headerScheme = new ScalarApiKeySecurityScheme();
        configureScheme(headerScheme);

        options.Authentication.SecuritySchemes[securitySchemeName] = headerScheme;

        return options;
    }

    /// <summary>
    /// Adds HTTP authentication configuration for a specific security scheme.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the HTTP authentication.</param>
    public static TOptions AddHttpAuthentication<TOptions>(this TOptions options, string securitySchemeName, Action<ScalarHttpSecurityScheme> configureScheme) where TOptions : ScalarOptions
    {
        options.Authentication ??= new ScalarAuthenticationOptions();
        options.Authentication.SecuritySchemes ??= new Dictionary<string, ScalarSecurityScheme>();


        if (options.Authentication.SecuritySchemes.TryGetValue(securitySchemeName, out var existingScheme) && existingScheme is ScalarHttpSecurityScheme existingHttpScheme)
        {
            configureScheme(existingHttpScheme);
            return options;
        }

        var httpScheme = new ScalarHttpSecurityScheme();
        configureScheme(httpScheme);

        options.Authentication.SecuritySchemes[securitySchemeName] = httpScheme;

        return options;
    }

    /// <summary>
    /// Controls the default HTTP client (default: shell/curl).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="target">The target to set.</param>
    /// <param name="client">The client to set.</param>
    public static TOptions WithDefaultHttpClient<TOptions>(this TOptions options, ScalarTarget target, ScalarClient client) where TOptions : ScalarOptions
    {
        options.DefaultHttpClient = new KeyValuePair<ScalarTarget, ScalarClient>(target, client);
        return options;
    }

    /// <summary>
    /// Controls the route pattern of the OpenAPI document.
    /// Can also be a complete URL to a remote OpenAPI document, just be aware of CORS restrictions in this case.
    /// The pattern can include the '{documentName}' placeholder which will be replaced with the document name.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="pattern">The route pattern to set.</param>
    public static TOptions WithOpenApiRoutePattern<TOptions>(this TOptions options, [StringSyntax("Route")] string pattern) where TOptions : ScalarOptions
    {
        options.OpenApiRoutePattern = pattern;
        return options;
    }

    /// <summary>
    /// Controls whether to expose 'dotnet' flag to the configuration.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="expose">Whether to expose 'dotnet'.</param>
    /// <remarks>
    /// This flag is used internally to indicate that the API Reference is being served from a .NET application.
    /// </remarks>
    public static TOptions WithDotNetFlag<TOptions>(this TOptions options, bool expose = true) where TOptions : ScalarOptions
    {
        options.DotNetFlag = expose;
        return options;
    }

    /// <summary>
    /// Sets whether the client button from the reference sidebar should be shown.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showButton">Whether to show the client button.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use HideClientButton() instead. Note: WithClientButton(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithClientButton<TOptions>(this TOptions options, bool showButton = true) where TOptions : ScalarOptions
    {
        options.HideClientButton = !showButton;
        return options;
    }

    /// <summary>
    /// Controls the base server URL that will be used to prefix all relative OpenAPI server URLs.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="baseServerUrl">The base server URL to set.</param>
    /// <remarks>
    /// When specified, this URL will be prepended to all relative server URLs defined in the OpenAPI document.
    /// For example, if BaseServerUrl is "https://api.example.com" and a server URL in the OpenAPI document is
    /// "/api", the resulting URL will be "https://api.example.com/api". This only affects relative server URLs;
    /// absolute URLs remain unchanged.
    /// </remarks>
    public static TOptions WithBaseServerUrl<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string baseServerUrl) where TOptions : ScalarOptions
    {
        options.BaseServerUrl = baseServerUrl;
        return options;
    }

    /// <summary>
    /// Sets whether authentication state should be persisted in local storage.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="persistAuth">Whether to persist authentication between page refreshes.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use EnablePersistentAuthentication() instead. Note: WithPersistentAuthentication(false) is the default behavior and can be removed entirely.")]
    public static TOptions WithPersistentAuthentication<TOptions>(this TOptions options, bool persistAuth = true) where TOptions : ScalarOptions
    {
        options.PersistentAuthentication = persistAuth;
        return options;
    }

    /// <summary>
    /// Sets whether required properties should be ordered first in schema properties.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="orderRequiredFirst">Whether to order required properties first.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use DisableRequiredPropertiesFirst() instead. Note: WithOrderRequiredPropertiesFirst(true) is the default behavior and can be removed entirely.")]
    public static TOptions WithOrderRequiredPropertiesFirst<TOptions>(this TOptions options, bool orderRequiredFirst = true) where TOptions : ScalarOptions
    {
        options.OrderRequiredPropertiesFirst = orderRequiredFirst;
        return options;
    }

    /// <summary>
    /// Controls the ordering method for schema properties (default: <see cref="PropertyOrder.Alpha" />).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="orderBy">The ordering method to use for schema properties.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use PreserveSchemaPropertyOrder() instead. Note: WithSchemaPropertyOrder(PropertyOrder.Alpha) is the default behavior and can be removed entirely.")]
    public static TOptions WithSchemaPropertyOrder<TOptions>(this TOptions options, PropertyOrder? orderBy) where TOptions : ScalarOptions
    {
        options.SchemaPropertyOrder = orderBy;
        return options;
    }

    /// <summary>
    /// Sets whether to show the operation ID in the UI.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="showOperationId">Whether to show the operation ID.</param>
    [Obsolete("This method is obsolete and will be removed in a future release. Please use ShowOperationId() instead. Note: WithShowOperationId(false) is the default behavior and can be removed entirely.")]
    public static TOptions WithShowOperationId<TOptions>(this TOptions options, bool showOperationId = true) where TOptions : ScalarOptions
    {
        options.ShowOperationId = showOperationId;
        return options;
    }
}