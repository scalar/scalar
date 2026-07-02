using System.Net;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace Scalar.Azure.Functions;

/// <inheritdoc />
internal sealed class ScalarApiReference(IOptionsSnapshot<ScalarOptions> optionsSnapshot) : IScalarApiReference
{
    private const string RouteRemainderKey = "path";

    /// <inheritdoc />
    public async Task<HttpResponseData> HandleAsync(HttpRequestData request, Action<ScalarOptions, HttpRequestData>? configureOptions = null)
    {
        var options = optionsSnapshot.Value;
        configureOptions?.Invoke(options, request);

        var requestPath = request.Url.AbsolutePath;
        var remainder = GetRouteRemainder(request);
        var gzipAccepted = AcceptsGzip(request.Headers);
        var ifNoneMatch = GetHeader(request.Headers, "If-None-Match");

        var result = ScalarRequestProcessor.Process(options, requestPath, remainder, gzipAccepted, ifNoneMatch);

        return await WriteResponseAsync(request, result);
    }

    /// <inheritdoc />
    public async Task HandleAsync(HttpContext httpContext, Action<ScalarOptions, HttpContext>? configureOptions = null)
    {
        var options = optionsSnapshot.Value;
        configureOptions?.Invoke(options, httpContext);

        var requestPath = httpContext.Request.Path.Value ?? "/";
        var remainder = httpContext.Request.RouteValues.TryGetValue(RouteRemainderKey, out var value) ? value?.ToString() : null;
        var gzipAccepted = AcceptsGzip(httpContext.Request.Headers.AcceptEncoding);
        var ifNoneMatch = httpContext.Request.Headers.IfNoneMatch.ToString();

        var result = ScalarRequestProcessor.Process(options, requestPath, remainder, gzipAccepted, string.IsNullOrEmpty(ifNoneMatch) ? null : ifNoneMatch);

        await WriteResponseAsync(httpContext, result);
    }

    private static async Task<HttpResponseData> WriteResponseAsync(HttpRequestData request, ScalarRenderResult result)
    {
        var response = request.CreateResponse();

        if (result.RedirectLocation is not null)
        {
            response.StatusCode = HttpStatusCode.Redirect;
            response.Headers.Add("Location", result.RedirectLocation);
            return response;
        }

        if (result.NotModified)
        {
            response.StatusCode = HttpStatusCode.NotModified;
            AddIfNotNull(response, "ETag", result.ETag);
            AddIfNotNull(response, "Cache-Control", result.CacheControl);
            if (result.VaryAcceptEncoding)
            {
                response.Headers.Add("Vary", "Accept-Encoding");
            }

            return response;
        }

        if (result.StatusCode == 404)
        {
            response.StatusCode = HttpStatusCode.NotFound;
            return response;
        }

        AddIfNotNull(response, "Cache-Control", result.CacheControl);
        if (result.VaryAcceptEncoding)
        {
            response.Headers.Add("Vary", "Accept-Encoding");
        }

        AddIfNotNull(response, "ETag", result.ETag);
        AddIfNotNull(response, "Content-Encoding", result.ContentEncoding);
        AddIfNotNull(response, "Content-Type", result.ContentType);

        response.StatusCode = HttpStatusCode.OK;

        if (result.Html is not null)
        {
            await response.Body.WriteAsync(Encoding.UTF8.GetBytes(result.Html));
        }
        else if (result.AssetStream is not null)
        {
            await using (result.AssetStream)
            {
                await result.AssetStream.CopyToAsync(response.Body);
            }
        }

        return response;
    }

    private static async Task WriteResponseAsync(HttpContext httpContext, ScalarRenderResult result)
    {
        var response = httpContext.Response;

        if (result.Nonce is not null)
        {
            httpContext.Items[ScalarOptions.NonceHttpContextItemKey] = result.Nonce;
        }

        if (result.RedirectLocation is not null)
        {
            response.Redirect(result.RedirectLocation);
            return;
        }

        if (result.NotModified)
        {
            response.StatusCode = StatusCodes.Status304NotModified;
            if (result.ETag is not null)
            {
                response.Headers.ETag = result.ETag;
            }

            if (result.CacheControl is not null)
            {
                response.Headers.CacheControl = result.CacheControl;
            }

            if (result.VaryAcceptEncoding)
            {
                response.Headers.Vary = "Accept-Encoding";
            }

            return;
        }

        if (result.StatusCode == 404)
        {
            response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        if (result.CacheControl is not null)
        {
            response.Headers.CacheControl = result.CacheControl;
        }

        if (result.VaryAcceptEncoding)
        {
            response.Headers.Vary = "Accept-Encoding";
        }

        if (result.ETag is not null)
        {
            response.Headers.ETag = result.ETag;
        }

        if (result.ContentEncoding is not null)
        {
            response.Headers.ContentEncoding = result.ContentEncoding;
        }

        response.StatusCode = StatusCodes.Status200OK;

        if (result.Html is not null)
        {
            response.ContentType = result.ContentType ?? "text/html";
            await response.WriteAsync(result.Html);
        }
        else if (result.AssetStream is not null)
        {
            response.ContentType = result.ContentType ?? "application/octet-stream";
            await using (result.AssetStream)
            {
                await result.AssetStream.CopyToAsync(response.Body);
            }
        }
    }

    private static void AddIfNotNull(HttpResponseData response, string name, string? value)
    {
        if (value is not null)
        {
            response.Headers.Add(name, value);
        }
    }

    private static string? GetRouteRemainder(HttpRequestData request)
    {
        if (request.FunctionContext.BindingContext.BindingData.TryGetValue(RouteRemainderKey, out var value))
        {
            // Route values may arrive JSON-quoted depending on the host; normalize to a plain string.
            return value?.ToString()?.Trim('"');
        }

        return null;
    }

    private static bool AcceptsGzip(HttpHeadersCollection headers)
    {
        return headers.TryGetValues("Accept-Encoding", out var values) &&
               values.Any(static value => value.Contains("gzip", StringComparison.OrdinalIgnoreCase));
    }

    private static bool AcceptsGzip(StringValues acceptEncoding)
    {
        foreach (var value in acceptEncoding)
        {
            if (value is not null && value.Contains("gzip", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static string? GetHeader(HttpHeadersCollection headers, string name)
    {
        return headers.TryGetValues(name, out var values) ? string.Join(",", values) : null;
    }
}
