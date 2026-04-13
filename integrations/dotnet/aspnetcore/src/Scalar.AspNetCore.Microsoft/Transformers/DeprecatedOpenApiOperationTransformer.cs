using Scalar.AspNetCore.Attributes;

namespace Scalar.AspNetCore;

internal sealed class DeprecatedOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var deprecatedAttribute = context.Description.ActionDescriptor.EndpointMetadata
            .OfType<DeprecatedAttribute>()
            .FirstOrDefault();


        if (deprecatedAttribute is null)
        {
            return Task.CompletedTask;
        }

        operation.Deprecated = true;

        var reason = deprecatedAttribute?.Reason;

        if (!string.IsNullOrWhiteSpace(reason))
        {
            operation.Description ??= string.Empty;
            operation.Description += reason;
        }

        return Task.CompletedTask;
    }
}