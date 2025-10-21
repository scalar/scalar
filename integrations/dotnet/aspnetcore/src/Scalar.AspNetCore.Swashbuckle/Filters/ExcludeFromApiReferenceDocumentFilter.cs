namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class ExcludeFromApiReferenceDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var tagOperations = new Dictionary<string, List<OpenApiOperation>>();

        // Group operations by tag
        foreach (var path in swaggerDoc.Paths)
        {
            if (path.Value.Operations is null)
            {
                continue;
            }

            foreach (var (_, operation) in path.Value.Operations)
            {
                var tags = operation.Tags ?? new HashSet<OpenApiTagReference>();

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
            var tagToExclude = swaggerDoc.Tags?.FirstOrDefault(t => t.Name == tag);
            if (tagToExclude is null)
            {
                // If the tag is not found, we can't add the ignore extension. So lets keep the ignore extension on the operations
                continue;
            }

            tagToExclude.Extensions ??= new Dictionary<string, IOpenApiExtension>();
            tagToExclude.Extensions.TryAdd(ScalarIgnore, new JsonNodeExtension(TrueNode));

            // Remove the ignore extension from all operations with this tag
            foreach (var openApiOperation in operations)
            {
                openApiOperation.Extensions?.Remove(ScalarIgnore);
            }
        }
    }
}