using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;

namespace Scalar.AspNetCore;

internal sealed class CodeSampleOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var codeSampleAttributes = context.Description.ActionDescriptor.EndpointMetadata.OfType<CodeSampleAttribute>().ToArray();

        if (codeSampleAttributes.Length == 0)
        {
            return Task.CompletedTask;
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


        return Task.CompletedTask;
    }
}