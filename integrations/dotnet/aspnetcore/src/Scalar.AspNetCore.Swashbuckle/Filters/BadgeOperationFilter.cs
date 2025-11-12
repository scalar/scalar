namespace Scalar.AspNetCore.Swashbuckle.Filters;

internal sealed class BadgeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var badgeAttributes = context.ApiDescription.ActionDescriptor.EndpointMetadata.OfType<BadgeAttribute>().ToArray();

        if (badgeAttributes.Length == 0)
        {
            return;
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
    }
}