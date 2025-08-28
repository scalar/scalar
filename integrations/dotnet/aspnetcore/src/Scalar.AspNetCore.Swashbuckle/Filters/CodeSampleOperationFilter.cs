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
        var samples = codeSampleAttributes.Select(codeSampleAttribute => new CodeSample
        {
            Source = codeSampleAttribute.Sample,
            Label = codeSampleAttribute.Label,
            Language = codeSampleAttribute.Language
        });

        var node = SerializeToNode(samples);
        operation.Extensions.TryAdd(CodeSamples, new JsonNodeExtension(node));
    }
}