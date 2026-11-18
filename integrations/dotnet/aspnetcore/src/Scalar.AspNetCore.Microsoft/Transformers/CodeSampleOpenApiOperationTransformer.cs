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
        var samples = codeSampleAttributes.Select(codeSampleAttribute => new CodeSample
        {
            Source = codeSampleAttribute.Sample,
            Label = codeSampleAttribute.Label,
            Language = codeSampleAttribute.Language
        });

        var node = SerializeToNode(samples);
        operation.Extensions.TryAdd(CodeSamples, new JsonNodeExtension(node));


        return Task.CompletedTask;
    }
}