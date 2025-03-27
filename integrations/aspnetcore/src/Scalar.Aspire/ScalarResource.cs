using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

public sealed class ScalarResource(string name) : Resource(name), IResourceWithEndpoints, IResourceWithWaitSupport;