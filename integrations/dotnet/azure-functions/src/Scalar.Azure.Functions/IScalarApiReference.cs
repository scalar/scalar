using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker.Http;

namespace Scalar.Azure.Functions;

/// <summary>
/// Renders the Scalar API reference from inside an Azure Functions HTTP trigger.
/// Resolve this service from dependency injection and call it from your function.
/// </summary>
/// <remarks>
/// Both Azure Functions HTTP models are supported. Register the service with
/// <c>services.AddScalarApiReference()</c> and route a catch-all HTTP trigger to it. The catch-all route
/// parameter must be named <c>path</c>, for example <c>Route = "scalar/{*path}"</c>.
/// </remarks>
public interface IScalarApiReference
{
    /// <summary>
    /// Handles a request using the built-in Azure Functions HTTP model (<see cref="HttpRequestData" />).
    /// </summary>
    /// <param name="request">The incoming request.</param>
    /// <param name="configureOptions">An optional callback to customize <see cref="ScalarOptions" /> per request.</param>
    /// <returns>The response to return from the function.</returns>
    Task<HttpResponseData> HandleAsync(HttpRequestData request, Action<ScalarOptions, HttpRequestData>? configureOptions = null);

    /// <summary>
    /// Handles a request using the ASP.NET Core integration HTTP model (<see cref="HttpContext" />).
    /// Writes the response directly to <see cref="HttpResponse" />.
    /// </summary>
    /// <param name="httpContext">The current HTTP context.</param>
    /// <param name="configureOptions">An optional callback to customize <see cref="ScalarOptions" /> per request.</param>
    Task HandleAsync(HttpContext httpContext, Action<ScalarOptions, HttpContext>? configureOptions = null);
}
