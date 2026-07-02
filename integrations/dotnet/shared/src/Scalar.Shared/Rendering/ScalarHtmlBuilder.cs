#if !SCALAR_ASPIRE
using System.Text.Encodings.Web;
using System.Text.Json;

#if SCALAR_AZURE_FUNCTIONS
namespace Scalar.Azure.Functions;
#else
namespace Scalar.AspNetCore;
#endif

/// <summary>
/// Builds the HTML shell that bootstraps the Scalar API reference. This logic is hosting-agnostic so it can be
/// reused across integrations (ASP.NET Core, Azure Functions, …).
/// </summary>
internal static class ScalarHtmlBuilder
{
    private const string DocumentName = "{documentName}";

    /// <summary>
    /// Renders the HTML document that loads and initializes the Scalar API reference.
    /// </summary>
    /// <param name="options">The configured Scalar options. Documents must already be resolved.</param>
    /// <param name="requestPath">The current request path, used by the client to compute the base path.</param>
    /// <param name="nonce">The effective nonce to emit on script tags, or <c>null</c>/empty to omit it.</param>
    /// <param name="helperFileName">The file name of the integration helper script (e.g. <c>scalar.aspnetcore.js</c>).</param>
    /// <param name="standaloneFileName">The fallback file name of the standalone bundle when no bundle URL is set.</param>
    internal static string BuildIndexHtml(ScalarOptions options, string requestPath, string? nonce, string helperFileName, string standaloneFileName)
    {
        var configuration = options.ToScalarConfiguration();
        var serializedConfiguration = JsonSerializer.Serialize(configuration, typeof(ScalarConfiguration), ScalarConfigurationSerializerContext.Default);

        var title = options.Documents.Count == 1 ? options.Title?.Replace(DocumentName, options.Documents[0].Name) : options.Title;
        var standaloneResourceUrl = string.IsNullOrEmpty(options.BundleUrl) ? standaloneFileName : options.BundleUrl;

        var escapedRequestPath = Uri.EscapeDataString(requestPath);

        var nonceAttribute = string.IsNullOrWhiteSpace(nonce)
            ? string.Empty
            : $" nonce=\"{HtmlEncoder.Default.Encode(nonce)}\"";

        return
            $$"""
              <!doctype html>
              <html>
              <head>
                  <title>{{title}}</title>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  {{options.HeadContent}}
              </head>
              <body>
                  {{options.HeaderContent}}
                  <div id="app"></div>
                  <script src="{{standaloneResourceUrl}}"{{nonceAttribute}}></script>
                  <script type="module" src="{{helperFileName}}"{{nonceAttribute}}></script>
                  <script type="module"{{nonceAttribute}}>
                      import { initialize } from './{{helperFileName}}'
                      initialize(
                      '{{escapedRequestPath}}',
                      {{options.DynamicBaseServerUrl.ToString().ToLowerInvariant()}},
                      {{serializedConfiguration}},
                      '{{options.JavaScriptConfiguration}}')
                  </script>
              </body>
              </html>
              """;
    }
}
#endif
