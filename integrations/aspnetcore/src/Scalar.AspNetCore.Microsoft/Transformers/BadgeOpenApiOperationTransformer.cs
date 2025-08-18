using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;

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

    return Task.CompletedTask;
  }
}
