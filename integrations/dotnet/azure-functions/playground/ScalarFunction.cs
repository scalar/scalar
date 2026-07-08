using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;

namespace Scalar.Azure.Functions.Playground;

/// <summary>
/// Serves the Scalar API reference (and its static assets) using the ASP.NET Core integration HTTP model.
/// The catch-all route parameter must be named <c>path</c> so the reference can resolve assets and document names.
/// </summary>
public class ScalarFunction(IScalarApiReference scalar)
{
    [Function("ScalarApiReference")]
    public Task Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "scalar/{*path}")] HttpRequest request)
        => scalar.HandleAsync(request.HttpContext);
}