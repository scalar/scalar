using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class CodeSampleDocumentFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // We use LastOrDefault because this allows a specific endpoint to override the attribute
        var codeSampleAttribute = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<CodeSampleAttribute>().LastOrDefault();

        if (codeSampleAttribute is null) return;

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();

        var sample = new OpenApiObject
        {
            ["source"] = new OpenApiString(codeSampleAttribute.Sample)
        };

        if (codeSampleAttribute.Language.HasValue)
        {
            sample["lang"] = new OpenApiString(codeSampleAttribute.Language.Value.ToStringFast(true));
        }

        if (codeSampleAttribute.Label is not null)
        {
            sample["label"] = new OpenApiString(codeSampleAttribute.Label);
        }

        OpenApiArray samples = [sample];
        operation.Extensions.Add(CodeSamples, samples);
    }
}