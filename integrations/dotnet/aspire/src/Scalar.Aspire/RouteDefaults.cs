namespace Scalar.Aspire;

internal static class RouteDefaults
{
    public const string ApiReferenceEndpoint = "/";

    public const string HealthCheckEndpoint = "/health";

    public const string ProxyEndpoint = "/scalar-proxy";

    public const string StaticFilesEndpoint = "/openapi";

    /// <summary>
    /// The mock server always serves the resolved OpenAPI document here; used for health checks.
    /// </summary>
    public const string MockServerOpenApiEndpoint = "/openapi.json";
}