using System.Diagnostics.CodeAnalysis;

namespace Scalar.Aspire;

/// <summary>
/// Represents all available options for the Scalar API reference.
/// Based on <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
/// </summary>
public abstract class ScalarOptions
{
    internal List<ScalarDocument> Documents { get; } = [];

    /// <summary>
    /// Gets or sets the route pattern of the OpenAPI document.
    /// Can also be a complete URL to a remote OpenAPI document, just be aware of CORS restrictions in this case.
    /// The pattern can include the '{documentName}' placeholder which will be replaced with the document name.
    /// </summary>
    /// <value>The default value is <c>"/openapi/{documentName}.json"</c>.</value>
    public string OpenApiRoutePattern { get; set; } = "/openapi/{documentName}.json";

    /// <summary>
    /// Gets or sets the proxy URL for the API requests.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? ProxyUrl { get; set; }

    /// <summary>
    /// Gets or sets whether the sidebar should be shown.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    public bool ShowSidebar { get; set; } = true;

    /// <summary>
    /// Gets or sets whether the sidebar and search should use the operation <i>summary</i> or the operation <i>path</i>.
    /// </summary>
    /// <value>The default value is <i>summary</i>.</value>
    public OperationTitleSource? OperationTitleSource { get; set; }

    /// <summary>
    /// Gets or sets whether models (components.schemas or definitions) should be hidden from the sidebar, search, and content.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideModels { get; set; }

    /// <summary>
    /// Gets or sets whether to hide the "Test Request" button.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideTestRequestButton { get; set; }

    /// <summary>
    /// Gets or sets whether dark mode is on or off initially.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    public bool DarkMode { get; set; } = true;

    /// <summary>
    /// Gets or sets the forced theme mode state.
    /// Forces the theme to always be in the specified state regardless of user preference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public ThemeMode? ForceThemeMode { get; set; }

    /// <summary>
    /// Gets or sets whether to hide the dark mode toggle.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideDarkModeToggle { get; set; }

    /// <summary>
    /// Gets or sets custom CSS to be passed directly to the component.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [StringSyntax("css")]
    public string? CustomCss { get; set; }

    /// <summary>
    /// Gets or sets the key used with CTRL/CMD to open the search modal.
    /// </summary>
    /// <value>The default value is <c>"k"</c>.</value>
    /// <remarks>For example, CMD+k or CTRL+k.</remarks>
    public string? SearchHotKey { get; set; }

    /// <summary>
    /// Gets or sets the color theme.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    /// <remarks>Select your preferred <see cref="ScalarTheme">ScalarTheme</see>.</remarks>
    public ScalarTheme? Theme { get; set; }

    /// <summary>
    /// Gets or sets the layout for the Scalar API reference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public ScalarLayout? Layout { get; set; }

    /// <summary>
    /// Gets or sets whether to use the default fonts.
    /// By default, Inter and JetBrains Mono are used, served by our CDN.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    /// <remarks>If you use a different font or just don't want to use Google Fonts, set this to <c>false</c>.</remarks>
    public bool DefaultFonts { get; set; } = true;

    /// <summary>
    /// Gets or sets whether all tags should be opened by default.
    /// By default, only the relevant tag based on the URL is opened.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>If you want all the tags open by default then set this configuration option.</remarks>
    public bool DefaultOpenAllTags { get; set; }

    /// <summary>
    /// Gets or sets the tag sorter for the Scalar API reference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public TagSorter? TagSorter { get; set; }

    /// <summary>
    /// Gets or sets the operation sorter for the Scalar API reference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public OperationSorter? OperationSorter { get; set; }

    /// <summary>
    /// Gets or sets whether HTTPSnippet clients should be hidden from the clients menu.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HiddenClients { get; set; }

    /// <summary>
    /// Gets or sets an array of HTTPSnippet clients that you want to display in the clients menu.
    /// </summary>
    /// <value>The default value is an empty array.</value>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarClient[] EnabledClients { get; set; } = [];

    /// <summary>
    /// Gets or sets an array of HTTPSnippet targets that you want to display in the clients menu.
    /// </summary>
    /// <value>The default value is an empty array.</value>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarTarget[] EnabledTargets { get; set; } = [];

    /// <summary>
    /// Gets or sets metadata information to configure meta information out of the box.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public IDictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// Gets or sets the authentication options to make authentication easier by prefilling credentials.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public ScalarAuthenticationOptions? Authentication { get; set; }

    /// <summary>
    /// Gets or sets the default HTTP client.
    /// </summary>
    /// <value>The default values are <see cref="ScalarTarget.Shell" /> and <see cref="ScalarClient.Curl" />.</value>
    public KeyValuePair<ScalarTarget, ScalarClient> DefaultHttpClient { get; set; } = new(ScalarTarget.Shell, ScalarClient.Curl);


    /// <summary>
    /// Gets or sets the list of servers for the Scalar API reference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    /// <remarks>This list will override the servers defined in the OpenAPI document.</remarks>
    public IList<ScalarServer>? Servers { get; set; }

    /// <summary>
    /// Gets or sets whether the client button from the reference sidebar should be hidden.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideClientButton { get; set; }

    /// <summary>
    /// Gets or sets the base server URL that will be used to prefix all relative OpenAPI server URLs.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    /// <remarks>
    /// When specified, this URL will be prepended to all relative server URLs defined in the OpenAPI document.
    /// For example, if BaseServerUrl is "https://api.example.com" and a server URL in the OpenAPI document is
    /// "/api", the resulting URL will be "https://api.example.com/api". This only affects relative server URLs;
    /// absolute URLs remain unchanged.
    /// </remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? BaseServerUrl { get; set; }

    /// <summary>
    /// Gets or sets whether authentication state should be persisted in local storage.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>
    /// When set to <c>true</c>, the authentication state will be stored in the browser's local storage and restored when the user returns to the page.
    /// </remarks>
    public bool PersistentAuthentication { get; set; }

    /// <summary>
    /// Gets or sets the type of document download available for the API documentation.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public DocumentDownloadType? DocumentDownloadType { get; set; }

    /// <summary>
    /// Gets or sets whether HTTPS should be preferred over HTTP when both are available.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>
    /// When set to <c>true</c>, HTTPS URLs will be prioritized when multiple endpoints are available.
    /// </remarks>
    public bool PreferHttpsEndpoint { get; set; }

    /// <summary>
    /// Gets or sets whether required properties should be ordered first in schema properties.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool OrderRequiredPropertiesFirst { get; set; }

    /// <summary>
    /// Gets or sets the ordering method for schema properties.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public PropertyOrder? SchemaPropertyOrder { get; set; }
}