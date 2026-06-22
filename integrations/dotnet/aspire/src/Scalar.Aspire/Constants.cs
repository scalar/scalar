namespace Scalar.Aspire;

internal static class Constants
{
    public const string Image = "scalarapi/aspire-api-reference";

    /// <remarks>
    /// This value is automatically updated by the pipeline.
    /// </remarks>
    public const string ImageTag = "latest";

    public const int DefaultPort = 8080;

    public const string DefaultResourceName = "scalar";

    public const string DefaultEndpointName = "http";

    /// <summary>
    /// The published Docker image for the Scalar Mock Server.
    /// </summary>
    public const string MockServerImage = "scalarapi/mock-server";

    /// <remarks>
    /// This value is automatically updated by the pipeline.
    /// </remarks>
    public const string MockServerImageTag = "latest";

    /// <summary>
    /// The port the mock server listens on inside the container.
    /// </summary>
    public const int MockServerDefaultPort = 3000;

    public const string MockServerDefaultResourceName = "mock-server";

    /// <summary>
    /// Default route used to resolve an OpenAPI document from a referenced resource.
    /// </summary>
    public const string MockServerDefaultDocumentRoute = "/openapi/v1.json";
}