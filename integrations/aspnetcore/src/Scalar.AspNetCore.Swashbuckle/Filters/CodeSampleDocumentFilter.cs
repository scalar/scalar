using Microsoft.OpenApi.Extensions;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class CodeSampleDocumentFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var codeSampleAttributes = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<CodeSampleAttribute>().ToArray();

        if (codeSampleAttributes.Length == 0)
        {
            return;
        }

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        List<CodeSample> samples = [];
        foreach (var codeSampleAttribute in codeSampleAttributes)
        {
            var sample = new CodeSample
            {
                Source = codeSampleAttribute.Sample
            };

            if (codeSampleAttribute.Language.HasValue)
            {
                sample.Language = codeSampleAttribute.Language.Value.ToStringFast(true);
            }

            if (codeSampleAttribute.Label is not null)
            {
                sample.Label = codeSampleAttribute.Label;
            }

            samples.Add(sample);
        }

        var node = SerializeToNode(samples);
        operation.Extensions.TryAdd(CodeSamples, new JsonNodeExtension(node));
    }
}