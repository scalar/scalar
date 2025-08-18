using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

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
    }
}