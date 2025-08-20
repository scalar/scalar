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

    private static async Task HandleProxy(HttpContext context, ILogger logger, IHttpForwarder forwarder, IForwarderHttpClientFactory factory, [FromQuery(Name = "scalar_url")] string targetUrl)
    {
        try
        {
            logger.LogProxyRequestReceived(targetUrl);

            // Parse the target URL to get host information
            if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var targetUri))
            {
                logger.LogInvalidTargetUrl(targetUrl);
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsync("The 'scalar_url' parameter must be a valid URL", context.RequestAborted);
                return;
            }

            var targetHost = $"{targetUri.Scheme}://{targetUri.Authority}";
            logger.LogForwardingRequest(targetHost, targetUri);

            var error = await forwarder.SendAsync(context, targetHost, _client, (_, proxyRequest) =>
            {
                proxyRequest.RequestUri = targetUri;
                return ValueTask.CompletedTask;
            });

            if (error != ForwarderError.None)
            {
                logger.LogProxyError(error, targetUrl);
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsync($"Proxy error: {error}", context.RequestAborted);
                return;
            }

            logger.LogProxyResponse(context.Response.StatusCode);

            HandleRedirectResponse(context, logger, targetUrl);

            logger.LogProxyRequestCompleted(targetUrl);
        }
        catch (Exception exception)
        {
            logger.LogUnexpectedProxyError(exception, targetUrl);

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsync("An unexpected error occurred while processing the proxy request", context.RequestAborted);
        }
    }

    private static void HandleRedirectResponse(HttpContext context, ILogger logger, string originalTargetUrl)
    {
        if (!IsRedirectStatusCode(context.Response.StatusCode))
            return;

        var locationHeader = context.Response.Headers.Location.FirstOrDefault();
        logger.LogRedirectDetected(locationHeader);

        if (string.IsNullOrEmpty(locationHeader) || !Uri.TryCreate(locationHeader, UriKind.Absolute, out var redirectUri))
        {
            logger.LogInvalidRedirectLocation(locationHeader);
            return;
        }

        if (IsLocalhostRedirect(redirectUri))
        {
            var rewrittenLocation = RewriteLocalhostToProxy(context.Request, redirectUri, originalTargetUrl);
            logger.LogLocalhostRedirectRewrite(locationHeader, rewrittenLocation);
            context.Response.Headers.Location = rewrittenLocation;
        }
        else
        {
            logger.LogNonLocalhostRedirect(locationHeader);
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