using System.Text.Json.Serialization;

namespace Scalar.AspNetCore;

internal class ScalarConfiguration
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

    public required string Theme { get; init; }

    public bool ShowSideBar { get; init; }

    public bool HideModels { get; set; }

    public bool HideDownloadButton { get; init; }

    public bool DarkMode { get; init; }

    public bool HideDarkModeToggle { get; init; }

    public bool DefaultOpenAllTags { get; init; }

    public bool WithDefaultFonts { get; init; }

    public string? ForceDarkModeState { get; init; }

    public string? CustomCss { get; init; }

    public string? SearchHotkey { get; init; }

    public Dictionary<string, string[]>? HiddenClients { get; init; }

    public IDictionary<string, string>? Metadata { get; init; }

    public ScalarAuthenticationOptions? Authentication { get; init; }

    public DefaultHttpClientConfig? DefaultHttpClient { get; init; }

    internal static ScalarConfiguration FromOptions(ScalarOptions options)
    {
        return new ScalarConfiguration
        {
            Theme = options.Theme.GetDescription(),
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
            Metadata = options.Metadata.Count != 0 ? options.Metadata : null,
            Authentication = options.Authentication.Enabled ? options.Authentication : null,
            HiddenClients = GetHiddenClients(options),
            DefaultHttpClient = new DefaultHttpClientConfig
            {
                ClientKey = options.DefaultHttpClient.ClientKey.GetDescription(),
                TargetKey = options.DefaultHttpClient.TargetKey.GetDescription()
            }
        };
    }

    private static Dictionary<string, string[]>? GetHiddenClients(ScalarOptions options)
    {
        var targets = ProcessOptions(options);

        return targets?.ToDictionary(k =>
                k.Key.GetDescription(),
            k => k.Value.Select(v => v.GetDescription()).ToArray()
        );
    }

    private static Dictionary<ScalarTargets, ScalarClients[]>? ProcessOptions(ScalarOptions options)
    {
        if (options.HiddenClients)
            return ClientOptions;

        if (options.EnabledTargets.Length == 0 &&
            options.EnabledClients.Length == 0)
            return null;

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

    internal sealed class DefaultHttpClientConfig
    {
        public required string TargetKey { get; init; }
        public required string ClientKey { get; init; }
    }
}

[JsonSerializable(typeof(ScalarConfiguration))]
[JsonSourceGenerationOptions(DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal sealed partial class ScalaConfigurationSerializerContext : JsonSerializerContext;