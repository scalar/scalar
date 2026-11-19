namespace Scalar.AspNetCore;

internal sealed class ExcludeFromApiReferenceOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var hasExcludeAttribute = context.Description.ActionDescriptor.EndpointMetadata.OfType<ExcludeFromApiReferenceAttribute>().Any();

        if (!hasExcludeAttribute)
        {
            return Task.CompletedTask;
        }

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        operation.Extensions.TryAdd(ScalarIgnore, new JsonNodeExtension(TrueNode));

        return Task.CompletedTask;
    }
}