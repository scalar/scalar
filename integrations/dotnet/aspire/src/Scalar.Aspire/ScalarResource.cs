using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

/// <summary>
/// Represents a Scalar container resource.
/// </summary>
/// <param name="name">The unique name identifier for the Scalar resource.</param>
public sealed class ScalarResource(string name) : ContainerResource(name), IResourceWithServiceDiscovery;