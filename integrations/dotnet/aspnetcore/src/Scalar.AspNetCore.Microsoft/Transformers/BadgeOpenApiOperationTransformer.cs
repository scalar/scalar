namespace Scalar.AspNetCore;

internal sealed class BadgeOpenApiOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var badgeAttributes = context.Description.ActionDescriptor.EndpointMetadata.OfType<BadgeAttribute>().ToArray();

        if (badgeAttributes.Length == 0)
        {
            return Task.CompletedTask;
        }

        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        var badges = badgeAttributes.Select(badgeAttribute => new Badge
        {
            Name = badgeAttribute.Name,
            Position = badgeAttribute.Position,
            Color = badgeAttribute.Color
        });

        var node = SerializeToNode(badges);
        operation.Extensions.TryAdd(Badges, new JsonNodeExtension(node));

        return Task.CompletedTask;
    }
}