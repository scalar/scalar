using System.Diagnostics.CodeAnalysis;

#if SCALAR_ASPIRE
namespace Scalar.Aspire;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Provides fluent extension methods for configuring <see cref="ScalarOptions" />.
/// These methods focus on behavior descriptions rather than property setters.
/// </summary>
public static partial class ScalarOptionsExtensions
{
    /// <summary>
    /// Hides the models section from the sidebar, search, and content.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideModels<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.HideModels = true;
        return options;
    }

    /// <summary>
    /// Hides the "Test Request" button from the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideTestRequestButton<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.HideTestRequestButton = true;
        return options;
    }

    /// <summary>
    /// Hides the dark mode toggle from the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideDarkModeToggle<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.HideDarkModeToggle = true;
        return options;
    }

    /// <summary>
    /// Hides the client button from the Reference sidebar.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideClientButton<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.HideClientButton = true;
        return options;
    }

    /// <summary>
    /// Hides the sidebar from the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideSidebar<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.ShowSidebar = false;
        return options;
    }

    /// <summary>
    /// Hides the download button from the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideDocumentDownload<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DocumentDownloadType = DocumentDownloadType.None;
        return options;
    }

    /// <summary>
    /// Sets the download button to show only JSON format.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions WithJsonDocumentDownload<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DocumentDownloadType = DocumentDownloadType.Json;
        return options;
    }

    /// <summary>
    /// Sets the download button to show only YAML format.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions WithYamlDocumentDownload<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DocumentDownloadType = DocumentDownloadType.Yaml;
        return options;
    }

    /// <summary>
    /// Sets the download button to show a direct link to the OpenAPI document.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions WithDirectDocumentDownload<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DocumentDownloadType = DocumentDownloadType.Direct;
        return options;
    }

    /// <summary>
    /// Expands all tags by default instead of only the relevant tag based on the URL.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions ExpandAllTags<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DefaultOpenAllTags = true;
        return options;
    }

    /// <summary>
    /// Expands all model sections by default instead of keeping them closed.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions ExpandAllModelSections<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.ExpandAllModelSections = true;
        return options;
    }

    /// <summary>
    /// Expands all response sections in operations by default instead of keeping them closed.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions ExpandAllResponses<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.ExpandAllResponses = true;
        return options;
    }

    /// <summary>
    /// Hides the sidebar search bar from the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions HideSearch<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.HideSearch = true;
        return options;
    }

    /// <summary>
    /// Enables persistent authentication in local storage.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions EnablePersistentAuthentication<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.PersistentAuthentication = true;
        return options;
    }

    /// <summary>
    /// Enables dark mode (overrides the default light mode).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions EnableDarkMode<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DarkMode = true;
        return options;
    }

    /// <summary>
    /// Disables the default fonts (Inter and JetBrains Mono from CDN).
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions DisableDefaultFonts<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.DefaultFonts = false;
        return options;
    }

    /// <summary>
    /// Sets the proxy URL for API requests.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    /// <param name="proxyUrl">The proxy URL to set.</param>
    public static TOptions WithProxy<TOptions>(this TOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string proxyUrl) where TOptions : ScalarOptions
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }

    /// <summary>
    /// Sets the layout to classic style.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions WithClassicLayout<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.Layout = ScalarLayout.Classic;
        return options;
    }

    /// <summary>
    /// Forces light mode regardless of user preference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions ForceLightMode<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.ForceThemeMode = ThemeMode.Light;
        return options;
    }

    /// <summary>
    /// Forces dark mode regardless of user preference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions ForceDarkMode<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.ForceThemeMode = ThemeMode.Dark;
        return options;
    }

    /// <summary>
    /// Preserves the original order of schema properties instead of sorting alphabetically.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions PreserveSchemaPropertyOrder<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.SchemaPropertyOrder = PropertyOrder.Preserve;
        return options;
    }

    /// <summary>
    /// Disables ordering required properties first.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions DisableRequiredPropertiesFirst<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.OrderRequiredPropertiesFirst = false;
        return options;
    }

    /// <summary>
    /// Shows the operation ID in the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions ShowOperationId<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.ShowOperationId = true;
        return options;
    }

    /// <summary>
    /// Sorts tags alphabetically in the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions SortTagsAlphabetically<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.TagSorter = TagSorter.Alpha;
        return options;
    }

    /// <summary>
    /// Sorts operations by HTTP method in the API Reference.
    /// </summary>
    /// <param name="options">The options to configure.</param>
    public static TOptions SortOperationsByMethod<TOptions>(this TOptions options) where TOptions : ScalarOptions
    {
        options.OperationSorter = OperationSorter.Method;
        return options;
    }
}