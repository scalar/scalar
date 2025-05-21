namespace Scalar.AspNetCore;

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
        { ScalarTarget.Python, [ScalarClient.Python3, ScalarClient.Requests] },
        { ScalarTarget.R, [ScalarClient.Httr] },
        { ScalarTarget.Ruby, [ScalarClient.Native] },
        { ScalarTarget.Shell, [ScalarClient.Curl, ScalarClient.Httpie, ScalarClient.Wget] },
        { ScalarTarget.Swift, [ScalarClient.Nsurlsession] },
        { ScalarTarget.Go, [ScalarClient.Native] },
        { ScalarTarget.Kotlin, [ScalarClient.OkHttp] },
        { ScalarTarget.Dart, [ScalarClient.Http] }
    };

    internal static ScalarConfiguration ToScalarConfiguration(this ScalarOptions options)
    {
        var sources = GetSources(options);
        return new ScalarConfiguration
        {
            ProxyUrl = options.ProxyUrl,
            Theme = options.Theme.ToStringFast(true),
            Layout = options.Layout.ToStringFast(true),
            Favicon = options.Favicon,
            DarkMode = options.DarkMode,
            HideModels = options.HideModels,
            HideDarkModeToggle = options.HideDarkModeToggle,
            HideDownloadButton = options.HideDownloadButton,
            HideTestRequestButton = options.HideTestRequestButton,
            DefaultOpenAllTags = options.DefaultOpenAllTags,
            ForceDarkModeState = options.ForceThemeMode?.ToStringFast(true),
            ShowSidebar = options.ShowSidebar,
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
            Integration = options.DotNetFlag ? "dotnet" : null,
            HideClientButton = options.HideClientButton,
            Sources = sources,
            BaseServerUrl = options.BaseServerUrl,
            PersistAuth = options.PersistentAuthentication
        };
    }

    private static IEnumerable<ScalarSource> GetSources(ScalarOptions options)
    {
        var trimmedOpenApiRoutePattern = options.OpenApiRoutePattern.TrimStart('/');
        return options.Documents.Select(document =>
        {
            var openApiRoutePattern = document.RoutePattern is null ? trimmedOpenApiRoutePattern : document.RoutePattern.TrimStart('/');
            return new ScalarSource
            {
                Title = document.Title ?? document.Name,
                Url = openApiRoutePattern.Replace(DocumentName, document.Name)
            };
        });
    }

    private static Dictionary<string, IEnumerable<string>>? GetHiddenClients(ScalarOptions options)
    {
        var targets = ProcessOptions(options);

        return targets?.ToDictionary(k =>
                k.Key.ToStringFast(true),
            k => k.Value.Select(v => v.ToStringFast(true))
        );
    }

    private static Dictionary<ScalarTarget, ScalarClient[]>? ProcessOptions(ScalarOptions options)
    {
        if (options.EnabledTargets.Length == 0 && options.EnabledClients.Length == 0)
        {
            return null;
        }

        var selected = new Dictionary<ScalarTarget, ScalarClient[]>();
        foreach (var item in ClientOptions)
        {
            if (options.EnabledTargets.Length != 0 &&
                !options.EnabledTargets.Contains(item.Key))
            {
                selected.Add(item.Key, item.Value);
                continue;
            }

            if (options.EnabledClients.Length == 0)
            {
                continue;
            }

            var clients = item.Value
                .Where(client => !options.EnabledClients.Contains(client))
                .ToArray();

            if (clients.Length != 0)
            {
                selected.Add(item.Key, clients);
            }
        }

        return selected;
    }
}