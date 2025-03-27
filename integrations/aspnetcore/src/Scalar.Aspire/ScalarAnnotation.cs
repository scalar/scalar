using Aspire.Hosting.ApplicationModel;
using Scalar.AspNetCore;

namespace Scalar.Aspire;

internal sealed record ScalarAnnotation(ProjectResource ProjectResource, Action<ScalarApiReferenceOptions>? ConfigureOptions) : IResourceAnnotation;