using System.Diagnostics.CodeAnalysis;

namespace Scalar.AspNetCore;

/// <summary>
/// Represents all available options for the Scalar API reference.
/// Based on <a href="https://github.com/scalar/scalar/blob/main/documentation/configuration.md">Configuration</a>.
/// </summary>
public sealed class ScalarOptions : ScalarApiReferenceOptions
{
    /// <summary>
    /// Gets or sets the title of the HTML document.
    /// </summary>
    /// <value>The default value is <c>'Scalar API Reference'</c>.</value>
    /// <remarks>Use the <c>{documentName}</c> placeholder to include the document name in the title.</remarks>
    public string? Title { get; set; } = "Scalar API Reference";

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
    /// Gets or sets the CDN URL for the API reference.
    /// </summary>
    /// <value>The default value is <c>null</c></value>
    /// <remarks>Use this option to load the API reference from a different CDN or local server.</remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? CdnUrl { get; set; }

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
    /// Gets or sets a value indicating whether the base server URL should be dynamically determined based on the request context.
    /// </summary>
    /// <value>The default value is <c>false</c>.</value>
    /// <remarks>
    /// When set to <c>true</c>, the <see cref="ScalarApiReferenceOptions.BaseServerUrl" /> property will be overwritten and the base server URL will be dynamically
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