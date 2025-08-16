namespace Scalar.AspNetCore;

internal sealed class ExcludeFromApiReferenceOpenApiDocumentTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var tagOperations = new Dictionary<string, List<OpenApiOperation>>();

        // Group operations by tag
        foreach (var path in document.Paths)
        {
            if (path.Value.Operations is null)
            {
                continue;
            }

            foreach (var (_, operation) in path.Value.Operations)
            {
#if NET10_0_OR_GREATER
                var tags = operation.Tags ?? new HashSet<OpenApiTagReference>();
#elif NET9_0
                var tags = operation.Tags ?? [];
#endif

                foreach (var tagName in tags.Select(tag => tag.Name))
                {
                    if (tagName is null)
                    {
                        continue;
                    }

                    if (!tagOperations.TryGetValue(tagName, out var operations))
                    {
                        operations = [];
                        tagOperations[tagName] = operations;
                    }

                    operations.Add(operation);
                }
            }
        }

        // Find all tags that should be fully ignored
        var tagsToExclude = tagOperations.Where(kvp => kvp.Value.All(operation => operation.Extensions is not null && operation.Extensions.ContainsKey(ScalarIgnore)));

        foreach (var (tag, operations) in tagsToExclude)
        {
            // Add the ignore extension to the tag
            var tagToExclude = document.Tags?.FirstOrDefault(t => t.Name == tag);
            if (tagToExclude is null)
            {
                // If the tag is not found, we can't add the ignore extension. So lets keep the ignore extension on the operations
                continue;
            }

            tagToExclude.Extensions ??= new Dictionary<string, IOpenApiExtension>();
#if NET10_0_OR_GREATER
            tagToExclude.Extensions.TryAdd(ScalarIgnore, new JsonNodeExtension(TrueNode));
#elif NET9_0
            tagToExclude.Extensions.TryAdd(ScalarIgnore, new OpenApiBoolean(true));
#endif

            // Remove the ignore extension from all operations with this tag
            foreach (var openApiOperation in operations)
            {
                openApiOperation.Extensions?.Remove(ScalarIgnore);
            }
        }

        return Task.CompletedTask;
    }
}