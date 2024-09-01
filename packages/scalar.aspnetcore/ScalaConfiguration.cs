using static Scalar.AspNetCore.ScalarClients;

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
    public string[] HiddenClients { get; init; } = Array.Empty<string>();
    public Dictionary<string, string>? Metadata { get; init; }
    public ScalarAuthenticationOptions? Authentication { get; init; }
    public ScalarDefaultHttpClient? DefaultHttpClient { get; init; }

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
        DefaultHttpClient = options.DefaultHttpClient;
        Metadata = options.Metadata.Any() ? options.Metadata : null;
        Authentication = options.Authentication.Enabled ? options.Authentication : null;
        HiddenClients = GetHiddenClients(options);
    }

    private string[] GetHiddenClients(ScalarOptions options)
    {
        var clients = GetAllClientKeys();

        if (options.HiddenClients)
            return clients;

        if (!options.EnabledClients.Any())
            return Array.Empty<string>();

        return clients
            .Except(options.EnabledClients)
            .ToArray();
    }

    private string[] GetAllClientKeys()
    {
        var options = new List<string>
        {
            Clojure.CLJ_HTTP,
            CSharp.HTTPCLIENT, CSharp.RESTSHARP,
            Go.NATIVE,
            Http.HTTP1_1,
            Java.ASYNCHTTP, Java.NETHTTP, Java.OKHTTP, Java.UNIREST,
            JavaScript.XHR, JavaScript.AXIOS, JavaScript.FETCH, JavaScript.JQUERY,
            Kotlin.OKHTTP,
            Node.UNDICI, Node.NATIVE, Node.REQUEST, Node.UNIREST, Node.AXIOS, Node.FETCH,
            ObjC.NSURLSESSION,
            OCaml.COHTTP,
            PHP.CURL, PHP.GUZZLE, PHP.HTTP1, PHP.HTTP2,
            PowerShell.WEBREQUEST, PowerShell.RESTMETHOD,
            Python.PYTHON3, Python.REQUESTS,
            R.HTTR,
            Ruby.NATIVE,
            Shell.CURL, Shell.HTTPIE, Shell.WGET,
            Swift.NSURLSESSION
        };

        return options.Distinct().ToArray();
    }
}
