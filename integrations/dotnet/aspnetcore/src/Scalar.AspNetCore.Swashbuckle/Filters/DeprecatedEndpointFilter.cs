using Scalar.AspNetCore.Attributes;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class DeprecatedOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var deprecatedAttr = context.ApiDescription.ActionDescriptor.EndpointMetadata
            .OfType<DeprecatedAttribute>()
            .FirstOrDefault();

        if (deprecatedAttr == null)
        {
            return;
        }

        operation.Deprecated = true;

        var reason = deprecatedAttr?.Reason;

        if (!string.IsNullOrWhiteSpace(reason))
        {
            operation.Description ??= string.Empty;
            operation.Description += reason;
        }
    }
}