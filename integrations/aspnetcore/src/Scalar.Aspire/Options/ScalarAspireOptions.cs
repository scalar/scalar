using System.Diagnostics.CodeAnalysis;
using Scalar.AspNetCore;

namespace Scalar.Aspire;

public sealed class ScalarAspireOptions : ScalarApiReferenceOptions
{
    /// <summary>
    /// Enables automatic proxying to prevent CORS issues.
    /// </summary>
    /// <value>Default is <c>true</c>.</value>
    /// <remarks>
    /// Uses YARP to forward requests to the server, bypassing same-origin restrictions.
    /// </remarks>
    public bool AutoProxy { get; set; }

    /// <summary>
    /// The title of the HTML document.
    /// </summary>
    /// <value>Default is <c>'Scalar API Reference'</c>.</value>
    public string? Title { get; set; } = "Scalar API Reference";

    /// <summary>
    /// The CDN URL for loading the API reference assets.
    /// </summary>
    /// <value>Default is <c>null</c>.</value>
    /// <remarks>Specify this to load the API reference from a custom CDN or local server.</remarks>
    [StringSyntax(StringSyntaxAttribute.Uri)]
    public string? CdnUrl { get; set; }

    /// <summary>
    /// Additional content to include in the HTML document's head section.
    /// </summary>
    /// <value>Default is <c>null</c>.</value>
    [StringSyntax("html")]
    public string? HeadContent { get; set; }

    /// <summary>
    /// HTML content to render in the page header.
    /// </summary>
    /// <value>Default is <c>null</c>.</value>
    /// <remarks>
    /// Appears after the <c>&lt;body&gt;</c> tag and before the API reference.
    /// </remarks>
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
}