using Aspire.Hosting.ApplicationModel;

namespace Scalar.Aspire;

internal sealed record ScalarAnnotation(IResource Resource, Func<ScalarOptions, CancellationToken, Task>? ConfigureOptions) : IResourceAnnotation;