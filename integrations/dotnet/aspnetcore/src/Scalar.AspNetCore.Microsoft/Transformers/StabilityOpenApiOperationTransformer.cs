namespace Scalar.AspNetCore;

internal sealed class StabilityOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        // We use LastOrDefault because this allows a specific endpoint to override the stability
        var stabilityAttribute = context.Description.ActionDescriptor.EndpointMetadata.OfType<StabilityAttribute>().LastOrDefault();

        if (stabilityAttribute is null)
        {
            return Task.CompletedTask;
        }

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        var node = SerializeToNode(stabilityAttribute.Stability);
        operation.Extensions.TryAdd(ScalarStability, new JsonNodeExtension(node));

        return Task.CompletedTask;
    }
}