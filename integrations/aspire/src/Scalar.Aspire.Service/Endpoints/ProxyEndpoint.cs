using Microsoft.AspNetCore.Mvc;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Forwarder;

namespace Scalar.Aspire.Service.Endpoints;

internal static class ProxyEndpoint
{
    private static HttpMessageInvoker _client = null!;

    internal static void MapScalarProxy(this IEndpointRouteBuilder endpoints)
    {
        var configuration = endpoints.ServiceProvider.GetRequiredService<IConfiguration>();
        var shouldAllowAllCertificates = configuration.GetValue<bool>(AllowSelfSignedCertificates);
        var factory = endpoints.ServiceProvider.GetRequiredService<IForwarderHttpClientFactory>();
        _client = factory.CreateClient(new ForwarderHttpClientContext
        {
            NewConfig = new HttpClientConfig
            {
                DangerousAcceptAnyServerCertificate = shouldAllowAllCertificates
            }
        });
        endpoints.Map(RouteDefaults.ProxyEndpoint, HandleProxy);
    }

    private static async Task HandleProxy(HttpContext context, IHttpForwarder forwarder, IForwarderHttpClientFactory factory, [FromQuery(Name = "scalar_url")] string targetUrl)
    {
        // Parse the target URL to get host information
        if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var targetUri))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("The 'scalar_url' parameter must be a valid URL", context.RequestAborted);
            return;
        }

        var targetHost = $"{targetUri.Scheme}://{targetUri.Authority}";
        var error = await forwarder.SendAsync(context, targetHost, _client, (_, proxyRequest) =>
        {
            proxyRequest.RequestUri = targetUri;
            return ValueTask.CompletedTask;
        });

        if (error != ForwarderError.None)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsync($"Proxy error: {error}", context.RequestAborted);
            return;
        }

        // Check if we got a redirect response and rewrite localhost URLs
        if (IsRedirectStatusCode(context.Response.StatusCode))
        {
            var locationHeader = context.Response.Headers.Location.FirstOrDefault();
            if (!string.IsNullOrEmpty(locationHeader) && Uri.TryCreate(locationHeader, UriKind.Absolute, out var redirectUri))
            {
                // Check if redirect is to localhost - rewrite it back to proxy
                if (IsLocalhostRedirect(redirectUri))
                {
                    var rewrittenLocation = RewriteLocalhostToProxy(context.Request, redirectUri, targetUrl);
                    context.Response.Headers.Location = rewrittenLocation;
                }
            }
        }
    }

    private static bool IsRedirectStatusCode(int statusCode) => statusCode is >= 300 and <= 399;

    private static bool IsLocalhostRedirect(Uri redirectUri) =>
        redirectUri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        redirectUri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);

    private static string RewriteLocalhostToProxy(HttpRequest request, Uri localhostUri, string originalTargetUrl)
    {
        // Extract the original service name from the target URL
        if (!Uri.TryCreate(originalTargetUrl, UriKind.Absolute, out var originalUri))
        {
            return localhostUri.ToString();
        }

        var serviceName = originalUri.Host;

        // Build new URL: https://service-name/path?query
        var rewrittenUri = new UriBuilder(localhostUri)
        {
            Host = serviceName,
            Port = -1 // Remove port
        };

        // Create proxy URL that points back to this proxy
        var proxyUrl = $"{request.Scheme}://{request.Host}{request.Path}?scalar_url={Uri.EscapeDataString(rewrittenUri.Uri.ToString())}";

        return proxyUrl;
    }
}