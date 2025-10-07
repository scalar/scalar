using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// Provides fluent extension methods for configuring <see cref="ScalarOptions" />.
/// These methods focus on behavior descriptions rather than property setters.
/// </summary>
public static partial class ScalarOptionsExtensions
{
    /// <summary>
    /// Hides the models section from the sidebar, search, and content.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideModels(this ScalarOptions options)
    {
        options.HideModels = true;
        return options;
    }

    /// <summary>
    /// Hides the "Test Request" button from the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideTestRequestButton(this ScalarOptions options)
    {
        options.HideTestRequestButton = true;
        return options;
    }

    /// <summary>
    /// Hides the dark mode toggle from the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideDarkModeToggle(this ScalarOptions options)
    {
        options.HideDarkModeToggle = true;
        return options;
    }

    /// <summary>
    /// Hides the client button from the Reference sidebar.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideClientButton(this ScalarOptions options)
    {
        options.HideClientButton = true;
        return options;
    }

    /// <summary>
    /// Hides the sidebar from the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideSidebar(this ScalarOptions options)
    {
        options.ShowSidebar = false;
        return options;
    }

    /// <summary>
    /// Hides the download button from the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideDocumentDownload(this ScalarOptions options)
    {
        options.DocumentDownloadType = DocumentDownloadType.None;
        return options;
    }

    /// <summary>
    /// Sets the download button to show only JSON format.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions WithJsonDocumentDownload(this ScalarOptions options)
    {
        options.DocumentDownloadType = DocumentDownloadType.Json;
        return options;
    }

    /// <summary>
    /// Sets the download button to show only YAML format.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions WithYamlDocumentDownload(this ScalarOptions options)
    {
        options.DocumentDownloadType = DocumentDownloadType.Yaml;
        return options;
    }

    /// <summary>
    /// Sets the download button to show a direct link to the OpenAPI document.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions WithDirectDocumentDownload(this ScalarOptions options)
    {
        options.DocumentDownloadType = DocumentDownloadType.Direct;
        return options;
    }

    /// <summary>
    /// Expands all tags by default instead of only the relevant tag based on the URL.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions ExpandAllTags(this ScalarOptions options)
    {
        options.DefaultOpenAllTags = true;
        return options;
    }

    /// <summary>
    /// Expands all model sections by default instead of keeping them closed.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions ExpandAllModelSections(this ScalarOptions options)
    {
        options.ExpandAllModelSections = true;
        return options;
    }

    /// <summary>
    /// Expands all response sections in operations by default instead of keeping them closed.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions ExpandAllResponses(this ScalarOptions options)
    {
        options.ExpandAllResponses = true;
        return options;
    }

    /// <summary>
    /// Hides the sidebar search bar from the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions HideSearch(this ScalarOptions options)
    {
        options.HideSearch = true;
        return options;
    }

    /// <summary>
    /// Enables persistent authentication in local storage.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions EnablePersistentAuthentication(this ScalarOptions options)
    {
        options.PersistentAuthentication = true;
        return options;
    }

    /// <summary>
    /// Enables dark mode (overrides the default light mode).
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions EnableDarkMode(this ScalarOptions options)
    {
        options.DarkMode = true;
        return options;
    }

    /// <summary>
    /// Disables the default fonts (Inter and JetBrains Mono from CDN).
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions DisableDefaultFonts(this ScalarOptions options)
    {
        options.DefaultFonts = false;
        return options;
    }

    /// <summary>
    /// Sets the proxy URL for API requests.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <param name="proxyUrl">The proxy URL to set.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions WithProxy(this ScalarOptions options, [StringSyntax(StringSyntaxAttribute.Uri)] string proxyUrl)
    {
        options.ProxyUrl = proxyUrl;
        return options;
    }

    /// <summary>
    /// Sets the layout to classic style.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions WithClassicLayout(this ScalarOptions options)
    {
        options.Layout = ScalarLayout.Classic;
        return options;
    }

    /// <summary>
    /// Forces light mode regardless of user preference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions ForceLightMode(this ScalarOptions options)
    {
        options.ForceThemeMode = ThemeMode.Light;
        return options;
    }

    /// <summary>
    /// Forces dark mode regardless of user preference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions ForceDarkMode(this ScalarOptions options)
    {
        options.ForceThemeMode = ThemeMode.Dark;
        return options;
    }

    /// <summary>
    /// Preserves the original order of schema properties instead of sorting alphabetically.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions PreserveSchemaPropertyOrder(this ScalarOptions options)
    {
        options.SchemaPropertyOrder = PropertyOrder.Preserve;
        return options;
    }

    /// <summary>
    /// Disables ordering required properties first.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions DisableRequiredPropertiesFirst(this ScalarOptions options)
    {
        options.OrderRequiredPropertiesFirst = false;
        return options;
    }

    /// <summary>
    /// Shows the operation ID in the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions ShowOperationId(this ScalarOptions options)
    {
        options.ShowOperationId = true;
        return options;
    }

    /// <summary>
    /// Sorts tags alphabetically in the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions SortTagsAlphabetically(this ScalarOptions options)
    {
        options.TagSorter = TagSorter.Alpha;
        return options;
    }

    /// <summary>
    /// Sorts operations by HTTP method in the API Reference.
    /// </summary>
    /// <param name="options">The <see cref="ScalarOptions" /> to configure.</param>
    /// <returns>The configured <see cref="ScalarOptions" />.</returns>
    public static ScalarOptions SortOperationsByMethod(this ScalarOptions options)
    {
        options.OperationSorter = OperationSorter.Method;
        return options;
    }
}