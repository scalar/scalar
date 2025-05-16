using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;


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
                var tags = operation.Tags ?? [];
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
#if NET10_0_OR_GREATER
            tagToExclude.Extensions ??= [];
            tagToExclude.Extensions.TryAdd(ScalarIgnore, new OpenApiAny(TrueNode));
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