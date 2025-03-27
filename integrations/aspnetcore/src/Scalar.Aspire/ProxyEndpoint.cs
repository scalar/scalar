using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Yarp.ReverseProxy.Forwarder;

namespace Scalar.Aspire;

internal static class ProxyEndpoint
{
    private static readonly HttpMessageInvoker Client = new(new SocketsHttpHandler());

    internal static void MapScalarProxy(this IEndpointRouteBuilder endpoints)
    {
        endpoints.Map("/proxy", HandleProxy);
    }

    private static async Task HandleProxy(HttpContext context, IHttpForwarder forwarder, [FromQuery(Name = "scalar_url")] string targetUrl)
    {
        // Parse the target URL to get host information
        if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var targetUri))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("The 'scalar_url' parameter must be a valid URL", context.RequestAborted);
            return;
        }

        var targetHost = $"{targetUri.Scheme}://{targetUri.Authority}";
        var error = await forwarder.SendAsync(context, targetHost, Client, (_, proxyRequest) =>
        {
            proxyRequest.RequestUri = targetUri;
            return ValueTask.CompletedTask;
        });

        if (error != ForwarderError.None)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsync($"Proxy error: {error}", context.RequestAborted);
        }
    }
}