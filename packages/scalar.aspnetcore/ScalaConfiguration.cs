namespace Scalar.AspNetCore;

internal class ScalaConfiguration
{
    public string Theme { get; init; } = "purple";
    public bool ShowSideBar { get; init; } = true;
    public bool HideModels { get; set; } = false;
    public bool HideDownloadButton { get; init; } = false;
    public bool DarkMode { get; init; } = true;
    public bool HideDarkModeToggle { get; set; } = false;
    public bool DefaultOpenAllTags { get; set; } = false;
    public bool WithDefaultFonts { get; init; } = true;

    public string? ForceDarkModeState { get; set; }
    public string? CustomCss { get; init; }
    public string? SearchHotkey { get; init; }
    public Dictionary<string, string[]>? HiddenClients { get; init; }
    public Dictionary<string, string>? Metadata { get; init; }
    public ScalarAuthenticationOptions? Authentication { get; init; }
    public DefaultHttpClientConfig? DefaultHttpClient { get; init; }

    public ScalaConfiguration(ScalarOptions options)
    {
        Theme = options.Theme.ToString().ToLower();
        DarkMode = options.DarkMode;
        HideModels = options.HideModels;
        HideDarkModeToggle = options.HideDarkModeToggle;
        HideDownloadButton = options.HideDownloadButton;
        DefaultOpenAllTags = options.DefaultOpenAllTags;
        ForceDarkModeState = options.ForceDarkModeState;
        ShowSideBar = options.ShowSideBar;
        WithDefaultFonts = options.WithDefaultFonts;
        CustomCss = options.CustomCss;
        SearchHotkey = options.SearchHotkey;
        Metadata = options.Metadata.Any() ? options.Metadata : null;
        Authentication = options.Authentication.Enabled ? options.Authentication : null;
        HiddenClients = GetHiddenClients(options);
        DefaultHttpClient = new DefaultHttpClientConfig(options.DefaultHttpClient);
    }

    private Dictionary<string, string[]>? GetHiddenClients(ScalarOptions options)
    {
        var targets = ProcessOptions(options);

        if (targets is null) 
            return null;

        return targets.ToDictionary(k => 
            k.Key.ToString().ToLower(), 
            k => k.Value.Select(v => v.GetDescription()).ToArray()
        );
    }

    private Dictionary<ScalarTargets, ScalarClients[]>? ProcessOptions(ScalarOptions options)
    {
        if (options.HiddenClients)
            return ClientOptions;

        if (!options.EnabledTargets.Any() &&
            !options.EnabledClients.Any())
            return null;

        var targets = ClientOptions
            .Where(g => !options.EnabledTargets.Contains(g.Key))
            .ToDictionary();

        var selected = new Dictionary<ScalarTargets, ScalarClients[]>();
        foreach(var item in ClientOptions)
        {
            if (options.EnabledTargets.Any() && 
                !options.EnabledTargets.Contains(item.Key))
            {
                selected.Add(item.Key, item.Value);
                continue;
            }

            if (options.EnabledClients.Any())
            {
                var clients = item.Value
                    .Where(client => !options.EnabledClients.Contains(client))
                    .ToArray();

                if (clients.Any())
                    selected.Add(item.Key, clients);
            }
        }

        return selected;
    }

    private Dictionary<ScalarTargets, ScalarClients[]> ClientOptions => new Dictionary<ScalarTargets, ScalarClients[]>
    {
        { ScalarTargets.C, new [] { ScalarClients.LIBCURL } },
        { ScalarTargets.Clojure, new [] { ScalarClients.CLJ_HTTP } },
        { ScalarTargets.CSharp, new [] { ScalarClients.HTTPCLIENT, ScalarClients.RESTSHARP } },
        { ScalarTargets.Http, new [] { ScalarClients.HTTP1_1 } },
        { ScalarTargets.Java, new [] { ScalarClients.ASYNCHTTP, ScalarClients.NETHTTP, ScalarClients.OKHTTP, ScalarClients.UNIREST } },
        { ScalarTargets.JavaScript, new [] { ScalarClients.XHR, ScalarClients.AXIOS, ScalarClients.FETCH, ScalarClients.JQUERY } },
        { ScalarTargets.Node, new [] { ScalarClients.UNDICI, ScalarClients.NATIVE, ScalarClients.REQUEST, ScalarClients.UNIREST, ScalarClients.AXIOS, ScalarClients.FETCH } },
        { ScalarTargets.ObjC, new [] { ScalarClients.NSURLSESSION } },
        { ScalarTargets.OCaml, new [] { ScalarClients.COHTTP } },
        { ScalarTargets.PHP, new [] { ScalarClients.CURL, ScalarClients.GUZZLE, ScalarClients.HTTP1, ScalarClients.HTTP2 } },
        { ScalarTargets.PowerShell, new [] { ScalarClients.WEBREQUEST, ScalarClients.RESTMETHOD } },
        { ScalarTargets.Python, new [] { ScalarClients.PYTHON3, ScalarClients.REQUESTS } },
        { ScalarTargets.R, new [] { ScalarClients.HTTR } },
        { ScalarTargets.Ruby, new [] { ScalarClients.NATIVE } },
        { ScalarTargets.Shell, new [] { ScalarClients.CURL, ScalarClients.HTTPIE, ScalarClients.WGET } },
        { ScalarTargets.Swift, new [] { ScalarClients.NSURLSESSION } },
        { ScalarTargets.Go, new [] { ScalarClients.NATIVE } },
        { ScalarTargets.Kotlin, new [] { ScalarClients.OKHTTP } },
    };

    public class DefaultHttpClientConfig
    {
        public string TargetKey { get; init; } = string.Empty;
        public string ClientKey { get; init; } = string.Empty;

        public DefaultHttpClientConfig(ScalarDefaultHttpClient options) 
        { 
            TargetKey = options.TargetKey.ToString().ToLower();
            ClientKey = options.ClientKey.GetDescription();
        }
    }
}
