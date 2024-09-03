namespace Scalar.AspNetCore;

internal static class ScalarOptionsMapper
{
    private static readonly Dictionary<ScalarTargets, ScalarClients[]> ClientOptions = new()
    {
        { ScalarTargets.C, [ScalarClients.Libcurl] },
        { ScalarTargets.Clojure, [ScalarClients.CljHttp] },
        { ScalarTargets.CSharp, [ScalarClients.HttpClient, ScalarClients.RestSharp] },
        { ScalarTargets.Http, [ScalarClients.Http11] },
        { ScalarTargets.Java, [ScalarClients.AsyncHttp, ScalarClients.NetHttp, ScalarClients.OkHttp, ScalarClients.Unirest] },
        { ScalarTargets.JavaScript, [ScalarClients.Xhr, ScalarClients.Axios, ScalarClients.Fetch, ScalarClients.JQuery] },
        { ScalarTargets.Node, [ScalarClients.Undici, ScalarClients.Native, ScalarClients.Request, ScalarClients.Unirest, ScalarClients.Axios, ScalarClients.Fetch] },
        { ScalarTargets.ObjC, [ScalarClients.Nsurlsession] },
        { ScalarTargets.OCaml, [ScalarClients.CoHttp] },
        { ScalarTargets.PHP, [ScalarClients.Curl, ScalarClients.Guzzle, ScalarClients.Http1, ScalarClients.Http2] },
        { ScalarTargets.PowerShell, [ScalarClients.WebRequest, ScalarClients.RestMethod] },
        { ScalarTargets.Python, [ScalarClients.Python3, ScalarClients.Requests] },
        { ScalarTargets.R, [ScalarClients.Httr] },
        { ScalarTargets.Ruby, [ScalarClients.Native] },
        { ScalarTargets.Shell, [ScalarClients.Curl, ScalarClients.Httpie, ScalarClients.Wget] },
        { ScalarTargets.Swift, [ScalarClients.Nsurlsession] },
        { ScalarTargets.Go, [ScalarClients.Native] },
        { ScalarTargets.Kotlin, [ScalarClients.OkHttp] }
    };

    internal static ScalarConfiguration ToScalarConfiguration(this ScalarOptions options)
    {
        return new ScalarConfiguration
        {
            Theme = options.Theme.ToStringFast(),
            DarkMode = options.DarkMode,
            HideModels = options.HideModels,
            HideDarkModeToggle = options.HideDarkModeToggle,
            HideDownloadButton = options.HideDownloadButton,
            DefaultOpenAllTags = options.DefaultOpenAllTags,
            ForceDarkModeState = options.ForceDarkModeState,
            ShowSideBar = options.ShowSideBar,
            WithDefaultFonts = options.WithDefaultFonts,
            CustomCss = options.CustomCss,
            SearchHotkey = options.SearchHotkey,
            Metadata = options.Metadata,
            Authentication = options.Authentication,
            HiddenClients = GetHiddenClients(options),
            DefaultHttpClient = new DefaultHttpClient
            {
                ClientKey = options.DefaultHttpClient.ClientKey.ToStringFast(),
                TargetKey = options.DefaultHttpClient.TargetKey.ToStringFast()
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

    private static Dictionary<ScalarTargets, ScalarClients[]>? ProcessOptions(ScalarOptions options)
    {
        if (options.HiddenClients)
        {
            return ClientOptions;
        }

        if (options.EnabledTargets.Length == 0 && options.EnabledClients.Length == 0)
        {
            return null;
        }

        var selected = new Dictionary<ScalarTargets, ScalarClients[]>();
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