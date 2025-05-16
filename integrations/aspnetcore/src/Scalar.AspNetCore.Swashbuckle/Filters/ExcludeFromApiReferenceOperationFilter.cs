using Microsoft.OpenApi.Extensions;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class ExcludeFromApiReferenceOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasExcludeAttribute = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<ExcludeFromApiReferenceAttribute>().Any();

        if (!hasExcludeAttribute)
        {
            return;
        }

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        operation.Extensions.TryAdd(ScalarIgnore, new JsonNodeExtension(TrueNode));
    }
}