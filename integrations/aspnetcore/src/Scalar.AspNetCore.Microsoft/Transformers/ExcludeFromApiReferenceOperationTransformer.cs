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
#if NET10_0_OR_GREATER
        operation.Extensions.TryAdd(ScalarIgnore, new JsonNodeExtension(TrueNode));
#elif NET9_0
        operation.Extensions.TryAdd(ScalarIgnore, new OpenApiBoolean(true));
#endif

        return Task.CompletedTask;
    }
}