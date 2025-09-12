using System.Runtime.CompilerServices;

namespace Scalar.Aspire;

internal static class ScalarOptionsMapper
{
    private const string DocumentName = "{documentName}";

    internal static readonly Dictionary<ScalarTarget, ScalarClient[]> ClientOptions = new()
    {
        { ScalarTarget.C, [ScalarClient.Libcurl] },
        { ScalarTarget.Clojure, [ScalarClient.CljHttp] },
        { ScalarTarget.CSharp, [ScalarClient.HttpClient, ScalarClient.RestSharp] },
        { ScalarTarget.Http, [ScalarClient.Http11] },
        { ScalarTarget.Java, [ScalarClient.AsyncHttp, ScalarClient.NetHttp, ScalarClient.OkHttp, ScalarClient.Unirest] },
        { ScalarTarget.JavaScript, [ScalarClient.Xhr, ScalarClient.Axios, ScalarClient.Fetch, ScalarClient.JQuery, ScalarClient.OFetch] },
        { ScalarTarget.Node, [ScalarClient.Undici, ScalarClient.Native, ScalarClient.Request, ScalarClient.Unirest, ScalarClient.Axios, ScalarClient.Fetch, ScalarClient.OFetch] },
        { ScalarTarget.ObjC, [ScalarClient.Nsurlsession] },
        { ScalarTarget.OCaml, [ScalarClient.CoHttp] },
        { ScalarTarget.Php, [ScalarClient.Curl, ScalarClient.Guzzle, ScalarClient.Http1, ScalarClient.Http2] },
        { ScalarTarget.PowerShell, [ScalarClient.WebRequest, ScalarClient.RestMethod] },
        { ScalarTarget.Python, [ScalarClient.Python3, ScalarClient.Requests, ScalarClient.HttpxSync, ScalarClient.HttpxAsync] },
        { ScalarTarget.R, [ScalarClient.Httr] },
        { ScalarTarget.Ruby, [ScalarClient.Native] },
        { ScalarTarget.Shell, [ScalarClient.Curl, ScalarClient.Httpie, ScalarClient.Wget] },
        { ScalarTarget.Swift, [ScalarClient.Nsurlsession] },
        { ScalarTarget.Go, [ScalarClient.Native] },
        { ScalarTarget.Kotlin, [ScalarClient.OkHttp] },
        { ScalarTarget.Dart, [ScalarClient.Http] },
        { ScalarTarget.Rust, [ScalarClient.Reqwest] }
    };

    internal static async IAsyncEnumerable<ScalarConfiguration> ToScalarConfigurationsAsync(this IAsyncEnumerable<ScalarOptions> options, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var option in options.WithCancellation(cancellationToken))
        {
            yield return option.ToScalarConfiguration();
        }
    }

    internal static ScalarConfiguration ToScalarConfiguration(this ScalarOptions options)
    {
        var sources = GetSources(options);
        return new ScalarConfiguration
        {
            ProxyUrl = options.ProxyUrl,
            Theme = options.Theme?.ToStringFast(true),
            Layout = options.Layout?.ToStringFast(true),
            DarkMode = options.DarkMode,
            HideModels = options.HideModels,
            HideDarkModeToggle = options.HideDarkModeToggle,
            HideTestRequestButton = options.HideTestRequestButton,
            DefaultOpenAllTags = options.DefaultOpenAllTags,
            ForceDarkModeState = options.ForceThemeMode?.ToStringFast(true),
            ShowSidebar = options.ShowSidebar,
            OperationTitleSource = options.OperationTitleSource?.ToStringFast(true),
            WithDefaultFonts = options.DefaultFonts,
            CustomCss = options.CustomCss,
            SearchHotKey = options.SearchHotKey,
            Servers = options.Servers,
            MetaData = options.Metadata,
            Authentication = options.Authentication,
            TagsSorter = options.TagSorter?.ToStringFast(true),
            OperationsSorter = options.OperationSorter?.ToStringFast(true),
            HiddenClients = options.HiddenClients ? options.HiddenClients : GetHiddenClients(options),
            DefaultHttpClient = new DefaultHttpClient
            {
                ClientKey = options.DefaultHttpClient.Value.ToStringFast(true),
                TargetKey = options.DefaultHttpClient.Key.ToStringFast(true)
            },
            HideClientButton = options.HideClientButton,
            Sources = sources,
            BaseServerUrl = options.BaseServerUrl,
            PersistAuth = options.PersistentAuthentication,
            DocumentDownloadType = options.DocumentDownloadType?.ToStringFast(true),
            OrderRequiredPropertiesFirst = options.OrderRequiredPropertiesFirst,
            OrderSchemaPropertiesBy = options.SchemaPropertyOrder?.ToStringFast(true)
        };
    }

    private static IEnumerable<ScalarSource> GetSources(ScalarOptions options)
    {
        var trimmedOpenApiRoutePattern = options.OpenApiRoutePattern.TrimStart('/');

        foreach (var (name, title, routePattern, isDefault) in options.Documents)
        {
            var openApiRoutePattern = routePattern is null ? trimmedOpenApiRoutePattern : routePattern.TrimStart('/');
            yield return new ScalarSource
            {
                Title = title ?? name,
                Url = openApiRoutePattern.Replace(DocumentName, name),
                Default = isDefault
            };
        }
    }

    private static Dictionary<string, IEnumerable<string>>? GetHiddenClients(ScalarOptions options)
    {
        if (options.EnabledTargets.Length == 0 && options.EnabledClients.Length == 0)
        {
            return null;
        }

        var hiddenClients = new Dictionary<string, IEnumerable<string>>(ClientOptions.Count);

        foreach (var item in ClientOptions)
        {
            if (options.EnabledTargets.Length > 0 && !options.EnabledTargets.Contains(item.Key))
            {
                var targetKey = item.Key.ToStringFast(true);
                var values = item.Value.Select(x => x.ToStringFast(true));

                hiddenClients[targetKey] = values;
                continue;
            }

            if (options.EnabledClients.Length == 0)
            {
                continue;
            }


            var clients = item.Value
                .Where(x => !options.EnabledClients.Contains(x))
                .Select(x => x.ToStringFast(true)).ToArray();

            // Only add to hidden clients if there are actually clients to hide
            if (clients.Length == 0)
            {
                continue;
            }

            var key = item.Key.ToStringFast(true);
            hiddenClients[key] = clients;
        }

        return hiddenClients.Count > 0 ? hiddenClients : null;
    }
}