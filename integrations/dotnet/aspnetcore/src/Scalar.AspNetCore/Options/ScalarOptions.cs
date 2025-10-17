using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents all available options for the Scalar API Reference.
/// Based on <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
/// </summary>
public partial class ScalarOptions
{
    /// <summary>
    /// Controls the title of the HTML document.
    /// </summary>
    /// <remarks>Use the <c>{documentName}</c> placeholder to include the document name in the title. The placeholder only works when there is one document configured.</remarks>
    public string? Title { get; set; } = "Scalar API Reference";

    /// <summary>
    /// Controls the path prefix to access the documentation.
    /// </summary>
    /// <remarks>
    /// This property is obsolete and will be removed in a future release. Please use the 'endpointPrefix' parameter of the <see cref="ScalarEndpointRouteBuilderExtensions.MapScalarApiReference(Microsoft.AspNetCore.Routing.IEndpointRouteBuilder)" /> method instead.
    /// </remarks>
    [Obsolete("This property is obsolete and will be removed in a future release. Please use the 'endpointPrefix' parameter of the 'MapScalarApiReference' method instead.")]
    public string EndpointPathPrefix { get; set; } = "/scalar";

    /// <summary>
    /// Controls the bundle URL for the API Reference.
    /// </summary>
    /// <remarks>Use this option to load the API Reference from a different bundle or local server.</remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? BundleUrl { get; set; }

    /// <summary>
    /// Controls the CDN URL for the API Reference.
    /// </summary>
    /// <remarks>Use this option to load the API Reference from a different CDN or local server.</remarks>
    [Obsolete("This property is obsolete and will be removed in a future release. Please use BundleUrl instead.")]
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? CdnUrl
    {
        get => BundleUrl;
        set => BundleUrl = value;
    }

    /// <summary>
    /// Controls additional content included in the head section of the HTML document.
    /// </summary>
    [StringSyntax("html")]
    public string? HeadContent { get; set; }

    /// <summary>
    /// Controls HTML content rendered in the header section of the page.
    /// This content will be embedded after the <c>&lt;body&gt;</c> tag and before the API Reference.
    /// </summary>
    /// <example>
    /// The following is an example of how to use this property:
    /// <code>HeaderContent = "&lt;header&gt;Welcome to my API Reference&lt;/header&gt;";</code>
    /// renders the following HTML:
    /// <code>
    /// <![CDATA[
    /// <body>
    ///     <header>Welcome to my API Reference</header>
    ///     <div id="app"></div>
    /// </body>
    /// ]]>
    /// </code>
    /// </example>
    [StringSyntax("html")]
    public string? HeaderContent { get; set; }

    /// <summary>
    /// Controls whether the base server URL should be dynamically determined based on the request context.
    /// </summary>
    /// <remarks>
    /// When set to <c>true</c>, the <see cref="BaseServerUrl" /> property will be overwritten and the base server URL will be dynamically
    /// adjusted based on the request context. This only works for relative server URLs.
    /// </remarks>
    public bool DynamicBaseServerUrl { get; set; }

    /// <summary>
    /// Controls the path to a custom configuration JavaScript module.
    /// </summary>
    /// <remarks>
    /// If the path is relative, it will be normalized relative to the base path.
    /// </remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? JavaScriptConfiguration { get; set; }
}