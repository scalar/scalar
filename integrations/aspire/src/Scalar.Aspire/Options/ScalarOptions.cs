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
    /// Controls whether the sidebar is shown (default: shown).
    /// </summary>
    public bool? ShowSidebar { get; set; }

    /// <summary>
    /// Controls whether the sidebar and search use the operation summary or path (default: <see cref="OperationTitleSource.Summary" />).
    /// </summary>
    public OperationTitleSource? OperationTitleSource { get; set; }

    /// <summary>
    /// Controls whether models are hidden from the sidebar, search, and content (default: shown).
    /// </summary>
    public bool? HideModels { get; set; }

    /// <summary>
    /// Controls whether the "Test Request" button is hidden (default: shown).
    /// </summary>
    public bool? HideTestRequestButton { get; set; }

    /// <summary>
    /// Controls whether dark mode is enabled initially (default: disabled).
    /// </summary>
    public bool? DarkMode { get; set; }

    /// <summary>
    /// Forces the theme to always be in the specified state regardless of user preference.
    /// </summary>
    public ThemeMode? ForceThemeMode { get; set; }

    /// <summary>
    /// Controls whether the dark mode toggle is hidden (default: shown).
    /// </summary>
    public bool? HideDarkModeToggle { get; set; }

    /// <summary>
    /// Controls custom CSS passed directly to the component.
    /// </summary>
    [StringSyntax("css")]
    public string? CustomCss { get; set; }

    /// <summary>
    /// Controls the key used with CTRL/CMD to open the search modal (default: 'k').
    /// </summary>
    /// <remarks>For example, CMD+k or CTRL+k.</remarks>
    public string? SearchHotKey { get; set; }

    /// <summary>
    /// Controls the color theme (default: <see cref="ScalarTheme.Default" />).
    /// </summary>
    public ScalarTheme? Theme { get; set; }

    /// <summary>
    /// Controls the layout for the Scalar API Reference (default: <see cref="ScalarLayout.Modern" />).
    /// </summary>
    public ScalarLayout? Layout { get; set; }

    /// <summary>
    /// Controls whether to use the default fonts (Inter and JetBrains Mono from CDN) (default: enabled).
    /// </summary>
    /// <remarks>If you use a different font or just don't want to use our CDN, set this to <c>false</c>.</remarks>
    public bool? DefaultFonts { get; set; }

    /// <summary>
    /// Controls whether all tags are opened by default (default: only relevant tag opened).
    /// </summary>
    /// <remarks>If you want all the tags open by default then set this configuration option.</remarks>
    public bool? DefaultOpenAllTags { get; set; }

    /// <summary>
    /// Controls whether all model sections are expanded by default (default: collapsed).
    /// </summary>
    public bool? ExpandAllModelSections { get; set; }

    /// <summary>
    /// Controls whether all response sections are expanded by default in operations (default: collapsed).
    /// </summary>
    public bool? ExpandAllResponses { get; set; }

    /// <summary>
    /// Controls whether the sidebar search bar is hidden (default: shown).
    /// </summary>
    public bool? HideSearch { get; set; }

    /// <summary>
    /// Controls the tag sorter for the Scalar API Reference.
    /// </summary>
    public TagSorter? TagSorter { get; set; }

    /// <summary>
    /// Controls the operation sorter for the Scalar API Reference.
    /// </summary>
    public OperationSorter? OperationSorter { get; set; }

    /// <summary>
    /// Controls whether HTTPSnippet clients are hidden from the clients menu.
    /// </summary>
    public bool HiddenClients { get; set; }

    /// <summary>
    /// Controls which HTTPSnippet clients are displayed in the clients menu.
    /// </summary>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarClient[] EnabledClients { get; set; } = [];

    /// <summary>
    /// Controls which HTTPSnippet targets are displayed in the clients menu.
    /// </summary>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarTarget[] EnabledTargets { get; set; } = [];

    /// <summary>
    /// Controls metadata information for configuring meta information out of the box.
    /// </summary>
    public IDictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// Controls authentication options for prefilling credentials.
    /// </summary>
    public ScalarAuthenticationOptions? Authentication { get; set; }

    /// <summary>
    /// Controls the default HTTP client (default: shell/curl).
    /// </summary>
    public KeyValuePair<ScalarTarget, ScalarClient>? DefaultHttpClient { get; set; }


    /// <summary>
    /// Controls the list of servers for the Scalar API Reference.
    /// </summary>
    /// <remarks>This list will override the servers defined in the OpenAPI document.</remarks>
    public IList<ScalarServer>? Servers { get; set; }

    /// <summary>
    /// Controls whether the client button from the Reference sidebar is hidden (default: shown).
    /// </summary>
    public bool? HideClientButton { get; set; }

    /// <summary>
    /// Controls the base server URL that will be used to prefix all relative OpenAPI server URLs.
    /// </summary>
    /// <remarks>
    /// When specified, this URL will be prepended to all relative server URLs defined in the OpenAPI document.
    /// For example, if BaseServerUrl is "https://api.example.com" and a server URL in the OpenAPI document is
    /// "/api", the resulting URL will be "https://api.example.com/api". This only affects relative server URLs;
    /// absolute URLs remain unchanged.
    /// </remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? BaseServerUrl { get; set; }

    /// <summary>
    /// Controls whether authentication state is persisted in local storage (default: not persisted).
    /// </summary>
    /// <remarks>
    /// When set to <c>true</c>, the authentication state will be stored in the browser's local storage and restored when the user returns to the page.
    /// </remarks>
    public bool? PersistentAuthentication { get; set; }

    /// <summary>
    /// Controls the type of document download available for the API documentation (default: <see cref="DocumentDownloadType.Both" />).
    /// </summary>
    public DocumentDownloadType? DocumentDownloadType { get; set; }

    /// <summary>
    /// Controls whether HTTPS should be preferred over HTTP when both are available.
    /// </summary>
    /// <remarks>
    /// When set to <c>true</c>, HTTPS URLs will be prioritized when multiple endpoints are available.
    /// </remarks>
    public bool PreferHttpsEndpoint { get; set; }

    /// <summary>
    /// Controls whether required properties are ordered first in schema properties (default: required first).
    /// </summary>
    public bool? OrderRequiredPropertiesFirst { get; set; }

    /// <summary>
    /// Controls the ordering method for schema properties (default: <see cref="PropertyOrder.Alpha" />).
    /// </summary>
    public PropertyOrder? SchemaPropertyOrder { get; set; }


    /// <summary>
    /// Controls whether the operation ID is shown in the UI (default: <c>false</c>).
    /// </summary>
    public bool? ShowOperationId { get; set; }
}