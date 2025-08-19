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
            logger.LogInformation("Proxy request received for target URL: {TargetUrl}", targetUrl);

            // Parse the target URL to get host information
            if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var targetUri))
            {
                logger.LogWarning("Invalid target URL provided: {TargetUrl}", targetUrl);
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsync("The 'scalar_url' parameter must be a valid URL", context.RequestAborted);
                return;
            }

            var targetHost = $"{targetUri.Scheme}://{targetUri.Authority}";
            logger.LogDebug("Forwarding request to target host: {TargetHost}, URI: {TargetUri}", targetHost, targetUri);

            var error = await forwarder.SendAsync(context, targetHost, _client, (_, proxyRequest) =>
            {
                proxyRequest.RequestUri = targetUri;
                return ValueTask.CompletedTask;
            });

            if (error != ForwarderError.None)
            {
                logger.LogError("Proxy error occurred: {Error} for target URL: {TargetUrl}", error, targetUrl);
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsync($"Proxy error: {error}", context.RequestAborted);
                return;
            }

            logger.LogDebug("Proxy response received with status code: {StatusCode}", context.Response.StatusCode);

            // Check if we got a redirect response and rewrite localhost URLs
            if (IsRedirectStatusCode(context.Response.StatusCode))
            {
                var locationHeader = context.Response.Headers.Location.FirstOrDefault();
                logger.LogDebug("Redirect response detected with location: {Location}", locationHeader);

                if (!string.IsNullOrEmpty(locationHeader) && Uri.TryCreate(locationHeader, UriKind.Absolute, out var redirectUri))
                {
                    // Check if redirect is to localhost - rewrite it back to proxy
                    if (IsLocalhostRedirect(redirectUri))
                    {
                        var rewrittenLocation = RewriteLocalhostToProxy(context.Request, redirectUri, targetUrl);
                        logger.LogInformation("Rewriting localhost redirect from {OriginalLocation} to {RewrittenLocation}", locationHeader, rewrittenLocation);
                        context.Response.Headers.Location = rewrittenLocation;
                    }
                    else
                    {
                        logger.LogDebug("Redirect to non-localhost URL, keeping original location: {Location}", locationHeader);
                    }
                }
                else
                {
                    logger.LogWarning("Invalid or missing location header in redirect response: {Location}", locationHeader);
                }
            }

            logger.LogInformation("Proxy request completed successfully for target URL: {TargetUrl}", targetUrl);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error occurred while proxying request to {TargetUrl}", targetUrl);

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsync("An unexpected error occurred while processing the proxy request", context.RequestAborted);
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