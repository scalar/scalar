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
#if NET10_0_OR_GREATER
        var badges = badgeAttributes.Select(badgeAttribute => new Badge
        {
            Name = badgeAttribute.Name,
            Position = badgeAttribute.Position,
            Color = badgeAttribute.Color
        });

        var node = SerializeToNode(badges);
        operation.Extensions.TryAdd(Badges, new JsonNodeExtension(node));
#elif NET9_0
        var badges = new OpenApiArray();

        foreach (var badgeAttribute in badgeAttributes)
        {
            var badge = new OpenApiObject
            {
                ["name"] = new OpenApiString(badgeAttribute.Name)
            };

            if (badgeAttribute.Position.HasValue)
            {
                badge["position"] = new OpenApiString(badgeAttribute.Position.Value.ToStringFast(true));
            }

            if (badgeAttribute.Color is not null)
            {
                badge["color"] = new OpenApiString(badgeAttribute.Color);
            }

            badges.Add(badge);
        }

        operation.Extensions.TryAdd(Badges, badges);
#endif

        return Task.CompletedTask;
    }
}