namespace Scalar.AspNetCore;

internal static class ScalarOptionsMapper
{
    private static readonly Dictionary<ScalarTarget, ScalarClient[]> ClientOptions = new()
    {
        { ScalarTarget.C, [ScalarClient.Libcurl] },
        { ScalarTarget.Clojure, [ScalarClient.CljHttp] },
        { ScalarTarget.CSharp, [ScalarClient.HttpClient, ScalarClient.RestSharp] },
        { ScalarTarget.Http, [ScalarClient.Http11] },
        { ScalarTarget.Java, [ScalarClient.AsyncHttp, ScalarClient.NetHttp, ScalarClient.OkHttp, ScalarClient.Unirest] },
        { ScalarTarget.JavaScript, [ScalarClient.Xhr, ScalarClient.Axios, ScalarClient.Fetch, ScalarClient.JQuery] },
        { ScalarTarget.Node, [ScalarClient.Undici, ScalarClient.Native, ScalarClient.Request, ScalarClient.Unirest, ScalarClient.Axios, ScalarClient.Fetch] },
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
        { ScalarTarget.Kotlin, [ScalarClient.OkHttp] }
    };

    internal static ScalarConfiguration ToScalarConfiguration(this ScalarOptions options)
    {
        return new ScalarConfiguration
        {
            Proxy = options.ProxyUrl,
            Theme = options.Theme.ToStringFast(),
            DarkMode = options.DarkMode,
            HideModels = options.HideModels,
            HideDarkModeToggle = options.HideDarkModeToggle,
            HideDownloadButton = options.HideDownloadButton,
            HideTestRequestButton = options.HideTestRequestButton,
            DefaultOpenAllTags = options.DefaultOpenAllTags,
            ForceDarkModeState = options.ForceThemeMode?.ToStringFast(),
            ShowSidebar = options.ShowSidebar,
            WithDefaultFonts = options.DefaultFonts,
            CustomCss = options.CustomCss,
            SearchHotKey = options.SearchHotKey,
            Metadata = options.Metadata,
            Authentication = options.Authentication,
            HiddenClients = GetHiddenClients(options),
            DefaultHttpClient = new DefaultHttpClient
            {
                ClientKey = options.DefaultHttpClient.Value.ToStringFast(),
                TargetKey = options.DefaultHttpClient.Key.ToStringFast()
            }
        };
    }

    private static Dictionary<string, string[]>? GetHiddenClients(ScalarOptions options)
    {
        var targets = ProcessOptions(options);

        return targets?.ToDictionary(k =>
                k.Key.ToStringFast(),
            k => k.Value.Select(v => v.ToStringFast()).ToArray()
        );
    }

    private static Dictionary<ScalarTarget, ScalarClient[]>? ProcessOptions(ScalarOptions options)
    {
        if (options.HiddenClients)
        {
            return ClientOptions;
        }

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