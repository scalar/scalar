using System.Diagnostics.CodeAnalysis;

namespace Scalar.Aspire;

/// <summary>
/// Provides extension methods for configuring <see cref="ScalarOptions" />.
/// </summary>
public static class ScalarOptionsExtensions
{
    /// <summary>
    /// Adds the specified OpenAPI document to the Scalar API reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="documentName">The name identifier for the OpenAPI document. This value will be used to replace the '{documentName}' placeholder in the <see cref="ScalarOptions.OpenApiRoutePattern"/>.</param>
    /// <param name="title">Optional display title for the document. If not provided, the document name will be used as the title.</param>
    /// <param name="routePattern">Optional route pattern for the OpenAPI document. If not provided, the <see cref="ScalarOptions.OpenApiRoutePattern"/> will be used. The pattern can include the '{documentName}' placeholder which will be replaced with the document name.</param>
    /// <param name="isDefault">Indicates whether this document should be the default selection when multiple documents are available. Only one document should be marked as default.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    /// <remarks>
    /// When multiple documents are added, they will be displayed as selectable options in a dropdown menu.
    /// If no documents are explicitly added, a default document named 'v1' will be used.
    /// The '{documentName}' placeholder in the route pattern will be replaced with the provided document name.
    /// </remarks>
    public static TOptions AddDocument<TOptions>(this TOptions options, string documentName, string? title = null, string? routePattern = null, bool isDefault = false) where TOptions : ScalarOptions
    {
        options.Documents.Add(new ScalarDocument(documentName, title, routePattern, isDefault));
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
    public static TOptions AddDocuments<TOptions>(this TOptions options, params IEnumerable<string> documentNames) where TOptions : ScalarOptions
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
    public static TOptions AddDocuments<TOptions>(this TOptions options, params IEnumerable<ScalarDocument> documents) where TOptions : ScalarOptions
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
    public static TOptions WithProxyUrl<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string proxyUrl) where TOptions : ScalarOptions
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
    public static TOptions WithSidebar<TOptions>(this TOptions options, bool showSidebar = true) where TOptions : ScalarOptions
    {
        options.ShowSidebar = showSidebar;
        return options;
    }

    /// <summary>
    /// Sets whether the sidebar link texts should display the method summary (<c>false</c>) or the method path (<c>true</c>).
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="operationTitleSource">Whether to use the method summary or the method path in the sidebar and search.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithOperationTitleSource<TOptions>(this TOptions options, OperationTitleSource operationTitleSource) where TOptions : ScalarOptions
    {
        options.OperationTitleSource = operationTitleSource;
        return options;
    }

    /// <summary>
    /// Sets whether models should be shown in the sidebar, search, and content.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showModels">Whether to show models.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithModels<TOptions>(this TOptions options, bool showModels = true) where TOptions : ScalarOptions
    {
        options.HideModels = !showModels;
        return options;
    }

    /// <summary>
    /// Sets whether to show the "Test Request" button.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="showTestRequestButton">Whether to show the test request button.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithTestRequestButton<TOptions>(this TOptions options, bool showTestRequestButton = true) where TOptions : ScalarOptions
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
    public static TOptions WithDarkMode<TOptions>(this TOptions options, bool darkMode = true) where TOptions : ScalarOptions
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
    public static TOptions WithForceThemeMode<TOptions>(this TOptions options, ThemeMode forceThemeMode) where TOptions : ScalarOptions
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
    public static TOptions WithDarkModeToggle<TOptions>(this TOptions options, bool showDarkModeToggle = true) where TOptions : ScalarOptions
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
    public static TOptions WithCustomCss<TOptions>(this TOptions options, [StringSyntax("css")] string customCss) where TOptions : ScalarOptions
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
    public static TOptions WithSearchHotKey<TOptions>(this TOptions options, string searchHotKey) where TOptions : ScalarOptions
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
    public static TOptions WithTheme<TOptions>(this TOptions options, ScalarTheme theme) where TOptions : ScalarOptions
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
    public static TOptions WithLayout<TOptions>(this TOptions options, ScalarLayout layout) where TOptions : ScalarOptions
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
    public static TOptions WithDefaultFonts<TOptions>(this TOptions options, bool useDefaultFonts = true) where TOptions : ScalarOptions
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
    public static TOptions WithDefaultOpenAllTags<TOptions>(this TOptions options, bool useOpenAllTags = true) where TOptions : ScalarOptions
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
    public static TOptions AddServer<TOptions>(this TOptions options, ScalarServer server) where TOptions : ScalarOptions
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
    public static TOptions AddServer<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url) where TOptions : ScalarOptions => options.AddServer(new ScalarServer(url));

    /// <summary>
    /// Adds a server to the list of servers in the <see cref="ScalarOptions" /> using a URL and description.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="url">The URL of the server to add.</param>
    /// <param name="description">The description of the server.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions AddServer<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string url, string description) where TOptions : ScalarOptions => options.AddServer(new ScalarServer(url, description));

    /// <summary>
    /// Adds metadata to the configuration.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="key">The metadata key.</param>
    /// <param name="value">The metadata value.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions AddMetadata<TOptions>(this TOptions options, string key, string value) where TOptions : ScalarOptions
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
    public static TOptions WithTagSorter<TOptions>(this TOptions options, TagSorter tagSorter) where TOptions : ScalarOptions
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
    public static TOptions WithOperationSorter<TOptions>(this TOptions options, OperationSorter operationSorter) where TOptions : ScalarOptions
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="scopes">A collection of scopes to request by default.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlows">An action to configure the OAuth2 flows.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the OAuth2 security scheme.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the implicit flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureFlow">An action to configure the password flow.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the API key authentication.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="securitySchemeName">The name of the security scheme as defined in the OpenAPI document.</param>
    /// <param name="configureScheme">An action to configure the HTTP authentication.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
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
    /// Sets the default HTTP client.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="target">The target to set.</param>
    /// <param name="client">The client to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithDefaultHttpClient<TOptions>(this TOptions options, ScalarTarget target, ScalarClient client) where TOptions : ScalarOptions
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
    public static TOptions WithOpenApiRoutePattern<TOptions>(this TOptions options, [StringSyntax("Route")] string pattern) where TOptions : ScalarOptions
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
    public static TOptions WithClientButton<TOptions>(this TOptions options, bool showButton = true) where TOptions : ScalarOptions
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
    public static TOptions WithBaseServerUrl<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string baseServerUrl) where TOptions : ScalarOptions
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
    public static TOptions WithPersistentAuthentication<TOptions>(this TOptions options, bool persistAuth = true) where TOptions : ScalarOptions
    {
        options.PersistentAuthentication = persistAuth;
        return options;
    }

    /// <summary>
    /// Sets the document download type for the Scalar API reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="documentDownloadType">The document download type to set.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithDocumentDownloadType<TOptions>(this TOptions options, DocumentDownloadType documentDownloadType) where TOptions : ScalarOptions
    {
        options.DocumentDownloadType = documentDownloadType;
        return options;
    }

    /// <summary>
    /// Sets whether HTTPS should be preferred over HTTP when both are available.
    /// </summary>
    /// <param name="options">The <see cref="ScalarAspireOptions" /> to configure.</param>
    /// <returns>The <see cref="ScalarAspireOptions" /> so that additional calls can be chained.</returns>
    public static TOptions PreferHttpsEndpoint<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.PreferHttpsEndpoint = true;
        return options;
    }

    /// <summary>
    /// Sets whether required properties should be ordered first in schema properties.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="orderRequiredFirst">Whether to order required properties first.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithOrderRequiredPropertiesFirst<TOptions>(this TOptions options, bool orderRequiredFirst = true) where TOptions : ScalarOptions
    {
        options.OrderRequiredPropertiesFirst = orderRequiredFirst;
        return options;
    }

    /// <summary>
    /// Sets the ordering method for schema properties.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="orderBy">The ordering method to use for schema properties.</param>
    /// <returns>The <see cref="ScalarOptions" /> so that additional calls can be chained.</returns>
    public static TOptions WithSchemaPropertyOrder<TOptions>(this TOptions options, PropertyOrder? orderBy) where TOptions : ScalarOptions
    {
        options.SchemaPropertyOrder = orderBy;
        return options;
    }
}