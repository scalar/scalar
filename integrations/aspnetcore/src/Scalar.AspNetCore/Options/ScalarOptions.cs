using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents all available options for the Scalar API reference.
/// Based on <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
/// </summary>
public sealed class ScalarOptions
{
    internal List<ScalarDocument> Documents { get; } = [];

    /// <summary>
    /// Gets or sets the title of the HTML document.
    /// </summary>
    /// <value>The default value is <c>'Scalar API Reference'</c>.</value>
    /// <remarks>Use the <c>{documentName}</c> placeholder to include the document name in the title.</remarks>
    public string? Title { get; set; } = "Scalar API Reference";

    /// <summary>
    /// Specify a path or URL to a favicon to be used for the documentation.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? Favicon { get; set; }

    /// <summary>
    /// Path prefix to access the documentation.
    /// </summary>
    /// <value>The default value is <c>'/scalar'</c>.</value>
    /// <remarks>
    /// This property is obsolete and will be removed in a future release. Please use the 'endpointPrefix' parameter of the <see cref="ScalarEndpointRouteBuilderExtensions.MapScalarApiReference(Microsoft.AspNetCore.Routing.IEndpointRouteBuilder)" /> method instead.
    /// </remarks>
    [Obsolete("This property is obsolete and will be removed in a future release. Please use the 'endpointPrefix' parameter of the 'MapScalarApiReference' method instead.")]
    public string EndpointPathPrefix { get; set; } = "/scalar";

    /// <summary>
    /// Gets or sets the route pattern of the OpenAPI document.
    /// Can also be a complete URL to a remote OpenAPI document, just be aware of CORS restrictions in this case.
    /// The pattern can include the '{documentName}' placeholder which will be replaced with the document name.
    /// </summary>
    /// <value>The default value is <c>'/openapi/{documentName}.json'</c>.</value>
    public string OpenApiRoutePattern { get; set; } = "/openapi/{documentName}.json";

    /// <summary>
    /// Proxy URL for the API requests.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? ProxyUrl { get; set; }

    /// <summary>
    /// Whether the sidebar should be shown.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    public bool ShowSidebar { get; set; } = true;

    /// <summary>
    /// Whether models (components.schemas or definitions) should be shown in the sidebar, search, and content.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideModels { get; set; }

    /// <summary>
    /// Whether to hide the "Download OpenAPI Specification" button.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideDownloadButton { get; set; }

    /// <summary>
    /// Whether to hide the "Test Request" button.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideTestRequestButton { get; set; }

    /// <summary>
    /// Whether dark mode is on or off initially.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    public bool DarkMode { get; set; } = true;

    /// <summary>
    /// ForceDarkModeState makes it always this state no matter what <c>'dark' | 'light'</c>.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public ThemeMode? ForceThemeMode { get; set; }

    /// <summary>
    /// Whether to hide the dark mode toggle.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideDarkModeToggle { get; set; }

    /// <summary>
    /// Pass custom CSS directly to the component.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [StringSyntax("css")]
    public string? CustomCss { get; set; }

    /// <summary>
    /// Key used with CTRL/CMD to open the search modal (e.g. CMD+k).
    /// </summary>
    /// <value>The default value is <c>k</c>.</value>
    public string? SearchHotKey { get; set; }

    /// <summary>
    /// Set color theme.
    /// </summary>
    /// <value>The default value is <see cref="ScalarTheme.Purple" />.</value>
    /// <remarks>Select your preferred <see cref="ScalarTheme.Purple">ScalarTheme</see>.</remarks>
    public ScalarTheme Theme { get; set; } = ScalarTheme.Purple;

    /// <summary>
    /// Gets or sets the layout for the Scalar API reference.
    /// </summary>
    /// <value>The default value is <see cref="ScalarLayout.Modern" />.</value>
    public ScalarLayout Layout { get; set; } = ScalarLayout.Modern;

    /// <summary>
    /// By default, we are using Inter and JetBrains Mono, served by Google Fonts.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    /// <remarks>If you use a different font or just don’t want to use Google Fonts, set this to <c>false</c>.</remarks>
    public bool DefaultFonts { get; set; } = true;

    /// <summary>
    /// By default, only the relevant tag based on the URL is opened.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>If you want all the tags open by default then set this configuration option.</remarks>
    public bool DefaultOpenAllTags { get; set; }

    /// <summary>
    /// Represents a sorter for tags in the Scalar API reference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public TagSorter? TagSorter { get; set; }

    /// <summary>
    /// Represents a sorter for operations in the Scalar API reference.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public OperationSorter? OperationSorter { get; set; }

    /// <summary>
    /// You can pass an array of HTTPSnippet clients to hide from the clients menu.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HiddenClients { get; set; }

    /// <summary>
    /// You can pass an array of HTTPSnippet clients that you want to display in the clients menu.
    /// </summary>
    /// <value>The default value is <see cref="Array.Empty{T}" />.</value>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarClient[] EnabledClients { get; set; } = [];

    /// <summary>
    /// You can pass an array of HTTPSnippet targets that you want to display in the clients menu.
    /// </summary>
    /// <value>The default value is <see cref="Array.Empty{T}" />.</value>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarTarget[] EnabledTargets { get; set; } = [];

    /// <summary>
    /// You can pass information to the config object to configure meta information out of the box.
    /// </summary>
    public IDictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// To make authentication easier, you can prefill the credentials.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public ScalarAuthenticationOptions? Authentication { get; set; }

    /// <summary>
    /// Gets or sets the default HTTP client.
    /// </summary>
    /// <value>The default values are <see cref="ScalarTarget.Shell" /> and <see cref="ScalarClient.Curl" />.</value>
    public KeyValuePair<ScalarTarget, ScalarClient> DefaultHttpClient { get; set; } = new(ScalarTarget.Shell, ScalarClient.Curl);

    /// <summary>
    /// Gets or sets the CDN URL for the API reference.
    /// </summary>
    /// <value>The default value is <c>null</c></value>
    /// <remarks>Use this option to load the API reference from a different CDN or local server.</remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? CdnUrl { get; set; }

    /// <summary>
    /// Gets or sets the list of servers for the Scalar API reference.
    /// </summary>
    /// <value>A list of <see cref="ScalarServer" /> representing the servers. The default value is <c>null</c>.</value>
    /// <remarks>This list will override the servers defined in the OpenAPI document.</remarks>
    public IList<ScalarServer>? Servers { get; set; }

    /// <summary>
    /// Gets or sets whether to expose 'dotnet' to the configuration.
    /// </summary>
    /// <value>A boolean that indicates if 'dotnet' should be exposed to the configuration. The default value is <c>true</c>.</value>
    public bool DotNetFlag { get; set; } = true;

    /// <summary>
    /// Gets or sets whether the client button from the reference sidebar should be hidden.
    /// </summary>
    /// <value>A boolean that indicates if the client button should be hidden. The default value is <c>false</c>.</value>
    public bool HideClientButton { get; set; }

    /// <summary>
    /// Gets or sets additional content to be included in the head section of the HTML document.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    [StringSyntax("html")]
    public string? HeadContent { get; set; }

    /// <summary>
    /// Gets or sets the HTML content to be rendered in the header section of the page.
    /// This content will be embedded after the <c>&lt;body&gt;</c> tag and before the API reference.
    /// </summary>
    /// <example>
    /// The following is an example of how to use this property:
    /// <code>HeaderContent = "&lt;header&gt;Welcome to my API reference&lt;/header&gt;";</code>
    /// renders the following HTML:
    /// <code>
    /// <![CDATA[
    /// <body>
    ///     <header>Welcome to my API reference</header>
    ///     <div id="app"></div>
    /// </body>
    /// ]]>
    /// </code>
    /// </example>
    [StringSyntax("html")]
    public string? HeaderContent { get; set; }

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
    /// Gets or sets a value indicating whether the base server URL should be dynamically determined based on the request context.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>
    /// When set to <c>true</c>, the <see cref="BaseServerUrl" /> property will be overwritten and the base server URL will be dynamically
    /// adjusted based on the request context. This only works for relative server URLs.
    /// </remarks>
    public bool DynamicBaseServerUrl { get; set; }

    /// <summary>
    /// Gets or sets the path to a custom configuration JS module.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    /// <remarks>
    /// If the path is relative, it will be normalized relative to the base path.
    /// </remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? JavaScriptConfiguration { get; set; }

    /// <summary>
    /// Gets or sets whether authentication state should be persisted in local storage.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>
    /// When set to <c>true</c>, the authentication state will be stored in the browser's local storage and restored when the user returns to the page.
    /// </remarks>
    public bool PersistentAuthentication { get; set; }
}