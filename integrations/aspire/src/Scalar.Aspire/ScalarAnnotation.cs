using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

internal sealed record ScalarAnnotation(IResource Resource, Action<ScalarOptions>? ConfigureOptions) : IResourceAnnotation;