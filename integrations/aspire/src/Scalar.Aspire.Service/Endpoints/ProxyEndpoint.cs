using Microsoft.AspNetCore.Mvc;
using Yarp.ReverseProxy.Configuration;
using Yarp.ReverseProxy.Forwarder;

namespace Scalar.Aspire.Service.Endpoints;

internal static class ProxyEndpoint
{
    private static HttpMessageInvoker _client = null!;

    internal static void MapScalarProxy(this IEndpointRouteBuilder endpoints)
    {
        var factory = endpoints.ServiceProvider.GetRequiredService<IForwarderHttpClientFactory>();
        _client = factory.CreateClient(new ForwarderHttpClientContext { NewConfig = HttpClientConfig.Empty });
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
        }
    }
}