using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;

namespace Scalar.AspNetCore;

internal sealed class CodeSampleOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        // We use LastOrDefault because this allows a specific endpoint to override the attribute
        var codeSampleAttribute = context.Description.ActionDescriptor.EndpointMetadata.OfType<CodeSampleAttribute>().LastOrDefault();

        if (codeSampleAttribute is null) return Task.CompletedTask;

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
        return Task.CompletedTask;
    }
}