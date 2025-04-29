using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;

namespace Scalar.AspNetCore;

internal sealed class StabilityOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        // We use LastOrDefault because this allows a specific endpoint to override the stability
        var stabilityAttribute = context.Description.ActionDescriptor.EndpointMetadata.OfType<StabilityAttribute>().LastOrDefault();

        if (stabilityAttribute is not null)
        {
            operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
#if NET10_0_OR_GREATER
            var node = SerializeToNode(stabilityAttribute.Stability);
            operation.Extensions.TryAdd(ScalarStability, new OpenApiAny(node));
#elif NET9_0
            operation.Extensions.TryAdd(ScalarStability, new OpenApiString(stabilityAttribute.Stability.ToStringFast(true)));
#endif
        }

        return Task.CompletedTask;
    }
}