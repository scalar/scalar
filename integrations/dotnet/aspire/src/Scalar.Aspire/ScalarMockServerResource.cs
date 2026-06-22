using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Represents a Scalar Mock Server container resource. The mock server generates realistic
/// mock API responses from an OpenAPI/Swagger document, so other resources can depend on it
/// as if it were the real service.
/// </summary>
/// <param name="name">The unique name identifier for the mock server resource.</param>
public sealed class ScalarMockServerResource(string name) : ContainerResource(name), IResourceWithServiceDiscovery
{
    /// <summary>
    /// The document configuration for this mock server. Populated by <c>AddScalarMockServer</c>
    /// and the <c>WithDocument*</c> extension methods.
    /// </summary>
    internal ScalarMockServerOptions Options { get; } = new();
}
