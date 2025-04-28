using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class ExcludeFromApiReferenceDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var tagOperations = new Dictionary<string, List<OpenApiOperation>>();

        // Group operations by tag
        foreach (var path in swaggerDoc.Paths)
        {
            foreach (var (_, operation) in path.Value.Operations)
            {
                var tags = operation.Tags ?? [];
                foreach (var tagName in tags.Select(tag => tag.Name))
                {
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
            var tagToExclude = swaggerDoc.Tags?.FirstOrDefault(t => t.Name == tag);
            if (tagToExclude is null)
            {
                // If the tag is not found, we can't add the ignore extension. So lets keep the ignore extension on the operations
                continue;
            }

            tagToExclude.Extensions.TryAdd(ScalarIgnore, new OpenApiBoolean(true));
            // Remove the ignore extension from all operations with this tag
            foreach (var openApiOperation in operations)
            {
                openApiOperation.Extensions?.Remove(ScalarIgnore);
            }
        }
    }
}