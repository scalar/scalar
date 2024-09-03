namespace Scalar.AspNetCore;

public sealed class ScalarOptions
{
    /// <summary>
    /// Metadata title
    /// </summary>
    /// <value>The default value is <c>'Scalar API Reference -- {documentName}'</c>.</value>
    /// <remarks>You can use {documentName}, and it will be replaced by the version number.</remarks>
    public string Title { get; set; } = "Scalar API Reference -- {documentName}";

    /// <summary>
    /// Path prefix to access the documentation.
    /// </summary>
    /// <value>The default value is <c>'/scalar/{documentName}'</c>.</value>
    /// <remarks>You can use {documentName}, and it will be replaced by the version number.</remarks>
    public string EndpointPathPrefix { get; set; } = "/scalar/{documentName}";

    public string CdnUrl { get; set; } = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";

    /// <summary>
    /// Whether the sidebar should be shown.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    public bool ShowSideBar { get; set; } = true;

    /// <summary>
    /// Whether models (components.schemas or definitions) should be shown in the sidebar, search and content.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideModels { get; set; } = false;

    /// <summary>
    /// Whether to show the "Download OpenAPI Specification" button
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideDownloadButton { get; set; } = false;

    /// <summary>
    /// Whether dark mode is on or off initially (light mode)
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    public bool DarkMode { get; set; } = true;

    /// <summary>
    /// ForceDarkModeState makes it always this state no matter what <c>'dark' | 'light'</c>
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? ForceDarkModeState { get; set; }

    /// <summary>
    /// Whether to show the dark mode toggle.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HideDarkModeToggle { get; set; }

    /// <summary>
    /// You can pass custom CSS directly to the component.
    /// </summary>
    /// <value>The default value is <c>null</c>.</value>
    public string? CustomCss { get; set; }

    /// <summary>
    /// Key used with CTRL/CMD to open the search modal (defaults to 'k' e.g. CMD+k)
    /// </summary>
    /// <value>The default value is <c>k</c>.</value>
    public string? SearchHotkey { get; set; }

    /// <summary>
    /// Set color theme.
    /// </summary>
    /// <value>The default value is Set <see cref="ScalarThemes.Purple" />.</value>
    /// <remarks>Select your preferred <see cref="ScalarThemes.Purple">ScalarTheme</see>.</remarks>
    public ScalarThemes Theme { get; set; } = ScalarThemes.Purple;

    /// <summary>
    /// By default, we are using Inter and JetBrains Mono, served by Google Fonts.
    /// </summary>
    /// <value>The default value is <c>true</c>.</value>
    /// <remarks>If you use a different font or just don�t want to use Google Fonts, pass withDefaultFonts: false to the configuration.</remarks>
    public bool WithDefaultFonts { get; set; } = true;

    /// <summary>
    /// By default we only open the relevant tag based on the url.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>if you want all the tags open by default then set this configuration option.</remarks>
    public bool DefaultOpenAllTags { get; set; }

    /// <summary>
    /// You can pass an array of httpsnippet clients to hide from the clients menu.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    public bool HiddenClients { get; set; } = false;

    /// <summary>
    /// You can pass an array of HTTPSnippet clients that you want to display in the clients menu.
    /// </summary>
    /// <value>The default value is <see cref="Array.Empty{T}" />.</value>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarClients[] EnabledClients { get; set; } = [];

    /// <summary>
    /// You can pass an array of HTTPSnippet targets that you want to display in the clients menu.
    /// </summary>
    /// <value>The default value is <see cref="Array.Empty{T}" />.</value>
    /// <remarks>If an empty array is sent, all options will be displayed.</remarks>
    public ScalarTargets[] EnabledTargets { get; set; } = [];

    /// <summary>
    /// You can pass information to the config object to configure meta information out of the box.
    /// </summary>
    public IDictionary<string, string>? Metadata { get; set; }

    /// <summary>
    /// To make authentication easier you can prefill the credentials for your users
    /// </summary>
    public ScalarAuthenticationOptions? Authentication { get; set; }

    /// <summary>
    /// By default, we�re using Shell/curl as the default HTTP client. Or, if that�s disabled (through hiddenClients), we�re just using the first available HTTP client.
    /// You can explicitly set the default HTTP client.
    /// </summary>
    public ScalarDefaultHttpClient DefaultHttpClient { get; set; } = new();

    /// <summary>
    /// Provides a function for setting the data URL for the API reference
    /// given the document name.
    /// </summary>
    public Func<string, string>? SetDataUrl { get; set; }
}

public sealed class ScalarDefaultHttpClient
{
    /// <summary>
    /// Default display target
    /// </summary>
    /// <value>The default value is <see cref="ScalarTargets.Shell" />.</value>
    public ScalarTargets TargetKey { get; set; } = ScalarTargets.Shell;

    /// <summary>
    /// Default display client
    /// </summary>
    /// <value>The default value is <see cref="ScalarClients.Curl" />.</value>
    public ScalarClients ClientKey { get; set; } = ScalarClients.Curl;
}