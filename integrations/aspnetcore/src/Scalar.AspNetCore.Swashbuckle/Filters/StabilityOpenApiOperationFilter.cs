using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class StabilityOpenApiOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // We use LastOrDefault because this allows a specific endpoint to override the stability
        var stabilityAttribute = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<StabilityAttribute>().LastOrDefault();

        if (stabilityAttribute is not null)
        {
            operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
            operation.Extensions.TryAdd(ScalarStability, new OpenApiString(stabilityAttribute.Stability.ToStringFast(true)));
        }
    }
}