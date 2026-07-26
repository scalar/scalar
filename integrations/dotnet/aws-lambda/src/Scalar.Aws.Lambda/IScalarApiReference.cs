using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;

namespace Scalar.Aws.Lambda;

/// <summary>
/// Renders the Scalar API reference from inside an AWS Lambda function fronted by an Amazon API Gateway
/// HTTP API (payload format 2.0). Resolve this service from dependency injection and call it from your function.
/// </summary>
/// <remarks>
/// Register the service with <c>services.AddScalarApiReference()</c> and route a catch-all HTTP API route to it.
/// The route must use the <c>{proxy+}</c> greedy path parameter, for example <c>ANY /scalar/{proxy+}</c> (plus
/// <c>GET /scalar</c> for the bare index).
/// </remarks>
public interface IScalarApiReference
{
    /// <summary>
    /// Handles a request coming from an Amazon API Gateway HTTP API (payload format 2.0).
    /// </summary>
    /// <param name="request">The incoming API Gateway request.</param>
    /// <param name="context">The Lambda execution context.</param>
    /// <param name="configureOptions">An optional callback to customize <see cref="ScalarOptions" /> per request.</param>
    /// <returns>The response to return from the function.</returns>
    Task<APIGatewayHttpApiV2ProxyResponse> HandleAsync(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context, Action<ScalarOptions, APIGatewayHttpApiV2ProxyRequest>? configureOptions = null);
}
