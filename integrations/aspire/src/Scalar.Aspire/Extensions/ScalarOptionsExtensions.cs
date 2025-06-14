using System.Diagnostics.CodeAnalysis;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static class ScalarOptionsExtensions
{
    // /// <summary>
    // /// Sets the title of the HTML document.
    // /// </summary>
    // /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    // /// <param name="title">The title to set. Use the <c>{documentName}</c> placeholder to include the document name in the title.</param>
    // /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    // public static ScalarOptions WithTitle(this ScalarOptions options, string title)
    // {
    //     options.Title = title;
    //     return options;
    // }

    /// <summary>
    /// Adds the specified OpenAPI document to the Scalar API reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="documentName">The name identifier for the OpenAPI document. This value will be used to replace the '{documentName}' placeholder in the <see cref="ScalarOptions.OpenApiRoutePattern"/>.</param>
    /// <param name="title">Optional display title for the document. If not provided, the document name will be used as the title.</param>
    /// <param name="routePattern">Optional route pattern for the OpenAPI document. If not provided, the <see cref="ScalarOptions.OpenApiRoutePattern"/> will be used. The pattern can include the '{documentName}' placeholder which will be replaced with the document name.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// The '{documentName}' placeholder in the route pattern will be replaced with the provided document name.
    /// </remarks>
    public static ScalarOptions AddDocument(this ScalarOptions options, string documentName, string? title = null, string? routePattern = null)
    {
        options.Documents.Add(new ScalarDocument(documentName, title, routePattern));
        return options;
    }

    /// <summary>
    /// Adds the specified OpenAPI documents to the Scalar API reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="documentNames">The name identifiers for the OpenAPI documents.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static ScalarOptions AddDocuments(this ScalarOptions options, params IEnumerable<string> documentNames)
    {
        var documents = documentNames.Select(documentName => new ScalarDocument(documentName));
        options.Documents.AddRange(documents);
        return options;
    }

    /// <summary>
    /// Adds the specified OpenAPI documents to the Scalar API reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="documents">A list of <see cref="ScalarDocument" />s to add.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// </remarks>
    public static ScalarOptions AddDocuments(this ScalarOptions options, params IEnumerable<ScalarDocument> documents)
    {
        options.Documents.AddRange(documents);
        return options;
    }

    /// <summary>
    /// Sets the proxy URL for the API requests.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="proxyUrl">The proxy URL to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithProxyUrl(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string proxyUrl)
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }

    /// <summary>
    /// Sets whether the sidebar should be shown.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showSidebar">Whether to show the sidebar.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithSidebar(this ScalarOptions options, bool showSidebar = true)
    {
        options.ShowSidebar = showSidebar;
        return options;
    }

    /// <summary>
    /// Sets whether models should be shown in the sidebar, search, and content.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showModels">Whether to show models.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithModels(this ScalarOptions options, bool showModels = true)
    {
        options.HideModels = !showModels;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Download OpenAPI Specification" button.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showDownloadButton">Whether to show the download button.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithDownloadButton(this ScalarOptions options, bool showDownloadButton = true)
    {
        options.HideDownloadButton = !showDownloadButton;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Test Request" button.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showTestRequestButton">Whether to show the test request button.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithTestRequestButton(this ScalarOptions options, bool showTestRequestButton = true)
    {
        options.HideTestRequestButton = !showTestRequestButton;
        return options;
    }

    /// <summary>
    /// Sets whether dark mode is on or off initially.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="darkMode">Whether dark mode is on or off initially.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithDarkMode(this ScalarOptions options, bool darkMode = true)
    {
        options.DarkMode = darkMode;
        return options;
    }

    /// <summary>
    /// Forces the theme mode to always be the specified state.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="forceThemeMode">The theme mode to force.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithForceThemeMode(this ScalarOptions options, ThemeMode forceThemeMode)
    {
        options.ForceThemeMode = forceThemeMode;
        return options;
    }

    /// <summary>
    /// Sets whether to show the dark mode toggle.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showDarkModeToggle">Whether to show the dark mode toggle.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithDarkModeToggle(this ScalarOptions options, bool showDarkModeToggle = true)
    {
        options.HideDarkModeToggle = !showDarkModeToggle;
        return options;
    }

    /// <summary>
    /// Sets custom CSS to be passed directly to the component.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="customCss">The custom CSS to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithCustomCss(this ScalarOptions options, [StringSyntax("css")] string customCss)
    {
        options.CustomCss = customCss;
        return options;
    }

    /// <summary>
    /// Sets the key used with CTRL/CMD to open the search modal.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="searchHotKey">The search hotkey to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithSearchHotKey(this ScalarOptions options, string searchHotKey)
    {
        options.SearchHotKey = searchHotKey;
        return options;
    }

    /// <summary>
    /// Sets the color theme.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="theme">The theme to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithTheme(this ScalarOptions options, ScalarTheme theme)
    {
        options.Theme = theme;
        return options;
    }

    /// <summary>
    /// Sets the layout for the Scalar API reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="layout">The layout to use.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithLayout(this ScalarOptions options, ScalarLayout layout)
    {
        options.Layout = layout;
        return options;
    }

    /// <summary>
    /// Sets whether to use the default fonts.
    /// By default, Inter and JetBrains Mono are used, served by our CDN.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="useDefaultFonts">Whether to use the default fonts.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>If you use a different font or just don't want to use our CDN, set this to <c>false</c>.</remarks>
    public static ScalarOptions WithDefaultFonts(this ScalarOptions options, bool useDefaultFonts = true)
    {
        options.DefaultFonts = useDefaultFonts;
        return options;
    }

    /// <summary>
    /// Sets whether all tags should be opened by default.
    /// By default, only the relevant tag based on the URL is opened.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="useOpenAllTags">Whether to open all tags by default.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>If you want all the tags open by default then set this configuration option.</remarks>
    public static ScalarOptions WithDefaultOpenAllTags(this ScalarOptions options, bool useOpenAllTags = true)
    {
        options.DefaultOpenAllTags = useOpenAllTags;
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="server">The <see cref="ScalarServer" /> to add.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddServer(this ScalarOptions options, ScalarServer server)
    {
        options.Servers ??= new List<ScalarServer>();
        options.Servers.Add(server);
        return options;
    }

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" /> using a URL.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="url">The URL of the server to add.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddServer(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url) => options.AddServer(new ScalarServer(url));

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" /> using a URL and description.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="url">The URL of the server to add.</param>
    /// <param name="description">The description of the server.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddServer(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url, string description) => options.AddServer(new ScalarServer(url, description));

    /// <summary>
    /// Adds metadata to the configuration.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="key">The metadata key.</param>
    /// <param name="value">The metadata value.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddMetadata(this ScalarOptions options, string key, string value)
    {
        options.Metadata ??= new Dictionary<string, string>();
        options.Metadata.Add(key, value);
        return options;
    }

    /// <summary>
    /// Sets the tag sorter for the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="tagSorter">The <see cref="TagSorter" /> to use.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithTagSorter(this ScalarOptions options, TagSorter tagSorter)
    {
        options.TagSorter = tagSorter;
        return options;
    }

    /// <summary>
    /// Sets the operation sorter for the <see cref="ScalarOptions" />.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="operationSorter">The <see cref="OperationSorter" /> to use.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithOperationSorter(this ScalarOptions options, OperationSorter operationSorter)
    {
        options.OperationSorter = operationSorter;
        return options;
    }

    /// <summary>
    /// Adds one or more preferred security schemes to the authentication options.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="preferredSchemes">A collection of preferred security schemes.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddPreferredSecuritySchemes(this ScalarOptions options, params IEnumerable<string> preferredSchemes)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="scopes">A collection of scopes to request by default.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// Default scopes are pre-selected in the UI when the user initiates an OAuth2 authentication flow.
    /// If the specified security scheme does not exist, a new one will be created.
    /// </remarks>
    public static ScalarOptions AddDefaultScopes(this ScalarOptions options, string securitySchemeName, params IEnumerable<string> scopes)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlows">An action to configure the OAuth2 flows.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// This method configures OAuth2 flows for the specified security scheme.
    /// It's a convenience method that calls <see cref="AddOAuth2Authentication"/> and configures the flows property.
    /// </remarks>
    public static ScalarOptions AddOAuth2Flows(this ScalarOptions options, string securitySchemeName, Action<ScalarFlows> configureFlows)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the OAuth2 security scheme.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// This method allows you to configure an OAuth2 security scheme for the specified security scheme name.
    /// If the security scheme already exists and is an OAuth2 scheme, the existing configuration will be updated.
    /// Otherwise, a new OAuth2 security scheme will be created and added to the authentication options.
    /// </remarks>
    public static ScalarOptions AddOAuth2Authentication(this ScalarOptions options, string securitySchemeName, Action<ScalarOAuth2SecurityScheme> configureScheme)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddClientCredentialsFlow(this ScalarOptions options, string securitySchemeName, Action<ClientCredentialsFlow> configureFlow)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddAuthorizationCodeFlow(this ScalarOptions options, string securitySchemeName, Action<AuthorizationCodeFlow> configureFlow)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the implicit flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddImplicitFlow(this ScalarOptions options, string securitySchemeName, Action<ImplicitFlow> configureFlow)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the password flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddPasswordFlow(this ScalarOptions options, string securitySchemeName, Action<PasswordFlow> configureFlow)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the API key authentication.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddApiKeyAuthentication(this ScalarOptions options, string securitySchemeName, Action<ScalarApiKeySecurityScheme> configureScheme)
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the HTTP authentication.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions AddHttpAuthentication(this ScalarOptions options, string securitySchemeName, Action<ScalarHttpSecurityScheme> configureScheme)
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
    /// Sets the default HTTP client.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="target">The target to set.</param>
    /// <param name="client">The client to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithDefaultHttpClient(this ScalarOptions options, ScalarTarget target, ScalarClient client)
    {
        options.DefaultHttpClient = new KeyValuePair<ScalarTarget, ScalarClient>(target, client);
        return options;
    }

    /// <summary>
    /// Sets the route pattern of the OpenAPI document.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="pattern">The route pattern to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithOpenApiRoutePattern(this ScalarOptions options, [StringSyntax("Route")] string pattern)
    {
        options.OpenApiRoutePattern = pattern;
        return options;
    }


    /// <summary>
    /// Sets whether the client button from the reference sidebar should be shown.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showButton">Whether to show the client button.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithClientButton(this ScalarOptions options, bool showButton = true)
    {
        options.HideClientButton = !showButton;
        return options;
    }

    /// <summary>
    /// Sets the base server URL that will be used to prefix all relative OpenAPI server URLs.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="baseServerUrl">The base server URL to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When specified, this URL will be prepended to all relative server URLs defined in the OpenAPI document.
    /// For example, if BaseServerUrl is "https://api.example.com" and a server URL in the OpenAPI document is
    /// "/api", the resulting URL will be "https://api.example.com/api". This only affects relative server URLs;
    /// absolute URLs remain unchanged.
    /// </remarks>
    public static ScalarOptions WithBaseServerUrl(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string baseServerUrl)
    {
        options.BaseServerUrl = baseServerUrl;
        return options;
    }

    /// <summary>
    /// Sets whether authentication state should be persisted in local storage.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="persistAuth">Whether to persist authentication between page refreshes.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static ScalarOptions WithPersistentAuthentication(this ScalarOptions options, bool persistAuth = true)
    {
        options.PersistentAuthentication = persistAuth;
        return options;
    }
}