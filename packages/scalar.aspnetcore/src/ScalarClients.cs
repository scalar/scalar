using System.ComponentModel;

namespace Scalar.AspNetCore;

public enum ScalarClients
{
    [Description("libcurl")]
    Libcurl,

    [Description("clj_http")]
    CljHttp,

    [Description("httpclient")]
    HttpClient,

    [Description("restsharp")]
    RestSharp,

    [Description("native")]
    Native,

    [Description("http1.1")]
    Http11,

    [Description("asynchttp")]
    AsyncHttp,

    [Description("nethttp")]
    NetHttp,

    [Description("okhttp")]
    OkHttp,

    [Description("unirest")]
    Unirest,

    [Description("xhr")]
    Xhr,

    [Description("axios")]
    Axios,

    [Description("fetch")]
    Fetch,

    [Description("jquery")]
    JQuery,

    [Description("undici")]
    Undici,

    [Description("request")]
    Request,

    [Description("nsurlsession")]
    Nsurlsession,

    [Description("cohttp")]
    CoHttp,

    [Description("curl")]
    Curl,

    [Description("guzzle")]
    Guzzle,

    [Description("http1")]
    Http1,

    [Description("http2")]
    Http2,

    [Description("webrequest")]
    WebRequest,

    [Description("restmethod")]
    RestMethod,

    [Description("python3")]
    Python3,

    [Description("requests")]
    Requests,

    [Description("httr")]
    Httr,

    [Description("httpie")]
    Httpie,

    [Description("wget")]
    Wget
}