using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class CodeSampleOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var codeSampleAttributes = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<CodeSampleAttribute>().ToArray();

        if (codeSampleAttributes.Length == 0)
        {
            return;
        }

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        var samples = new OpenApiArray();
        foreach (var codeSampleAttribute in codeSampleAttributes)
        {
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

            samples.Add(sample);
        }

        operation.Extensions.TryAdd(CodeSamples, samples);
    }
}