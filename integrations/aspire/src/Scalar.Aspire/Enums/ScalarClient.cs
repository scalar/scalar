using System.ComponentModel;
using NetEscapades.EnumGenerators;

namespace Scalar.Aspire;

/// <summary>
/// Represents the different clients available in Scalar.
/// </summary>
[EnumExtensions]
public enum ScalarClient
{
    /// <summary>
    /// Libcurl client.
    /// </summary>
    [Description("libcurl")]
    Libcurl,

    /// <summary>
    /// Clojure HTTP client.
    /// </summary>
    [Description("clj_http")]
    CljHttp,

    /// <summary>
    /// HttpClient client.
    /// </summary>
    [Description("httpclient")]
    HttpClient,

    /// <summary>
    /// Http client.
    /// </summary>
    [Description("http")]
    Http,

    /// <summary>
    /// RestSharp client.
    /// </summary>
    [Description("restsharp")]
    RestSharp,

    /// <summary>
    /// Native client.
    /// </summary>
    [Description("native")]
    Native,

    /// <summary>
    /// HTTP/1.1 client.
    /// </summary>
    [Description("http1.1")]
    Http11,

    /// <summary>
    /// AsyncHttp client.
    /// </summary>
    [Description("asynchttp")]
    AsyncHttp,

    /// <summary>
    /// NetHttp client.
    /// </summary>
    [Description("nethttp")]
    NetHttp,

    /// <summary>
    /// OkHttp client.
    /// </summary>
    [Description("okhttp")]
    OkHttp,

    /// <summary>
    /// Unirest client.
    /// </summary>
    [Description("unirest")]
    Unirest,

    /// <summary>
    /// XMLHttpRequest client.
    /// </summary>
    [Description("xhr")]
    Xhr,

    /// <summary>
    /// Axios client.
    /// </summary>
    [Description("axios")]
    Axios,

    /// <summary>
    /// Fetch API client.
    /// </summary>
    [Description("fetch")]
    Fetch,

    /// <summary>
    /// jQuery client.
    /// </summary>
    [Description("jquery")]
    JQuery,

    /// <summary>
    /// Undici client.
    /// </summary>
    [Description("undici")]
    Undici,

    /// <summary>
    /// Request client.
    /// </summary>
    [Description("request")]
    Request,

    /// <summary>
    /// NSURLSession client.
    /// </summary>
    [Description("nsurlsession")]
    Nsurlsession,

    /// <summary>
    /// CoHttp client.
    /// </summary>
    [Description("cohttp")]
    CoHttp,

    /// <summary>
    /// Curl client.
    /// </summary>
    [Description("curl")]
    Curl,

    /// <summary>
    /// Guzzle client.
    /// </summary>
    [Description("guzzle")]
    Guzzle,

    /// <summary>
    /// HTTP/1 client.
    /// </summary>
    [Description("http1")]
    Http1,

    /// <summary>
    /// HTTP/2 client.
    /// </summary>
    [Description("http2")]
    Http2,

    /// <summary>
    /// WebRequest client.
    /// </summary>
    [Description("webrequest")]
    WebRequest,

    /// <summary>
    /// RestMethod client.
    /// </summary>
    [Description("restmethod")]
    RestMethod,

    /// <summary>
    /// Python 3 client.
    /// </summary>
    [Description("python3")]
    Python3,

    /// <summary>
    /// Requests client.
    /// </summary>
    [Description("requests")]
    Requests,

    /// <summary>
    /// Httr client.
    /// </summary>
    [Description("httr")]
    Httr,

    /// <summary>
    /// Httpie client.
    /// </summary>
    [Description("httpie")]
    Httpie,

    /// <summary>
    /// Wget client.
    /// </summary>
    [Description("wget")]
    Wget,

    /// <summary>
    /// OFetch client.
    /// </summary>
    [Description("ofetch")]
    OFetch,

    /// <summary>
    /// HTTPX (Sync) client.
    /// </summary>
    [Description("httpx_sync")]
    HttpxSync,

    /// <summary>
    /// HTTPX (Async) client.
    /// </summary>
    [Description("httpx_async")]
    HttpxAsync,

    /// <summary>
    /// Reqwest client.
    /// </summary>
    [Description("reqwest")]
    Reqwest
}