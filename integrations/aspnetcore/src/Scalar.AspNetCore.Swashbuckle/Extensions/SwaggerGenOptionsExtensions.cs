using Microsoft.Extensions.DependencyInjection;
using Scalar.AspNetCore.Swashbuckle.Filters;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Scalar.AspNetCore;

/// <summary>
/// Provides extension methods for <see cref="SwaggerGenOptions" />.
/// </summary>
public static class SwaggerGenOptionsExtensions
{
    /// <summary>
    /// Adds required Scalar filters to the <see cref="SwaggerGenOptions" />.
    /// </summary>
    /// <param name="options"><see cref="SwaggerGenOptions" />.</param>
    public static SwaggerGenOptions AddScalarFilters(this SwaggerGenOptions options)
    {
        options.DocumentFilter<ExcludeFromApiReferenceDocumentFilter>();
        options.OperationFilter<ExcludeFromApiReferenceOperationFilter>();
        options.OperationFilter<StabilityOpenApiOperationFilter>();
        options.OperationFilter<CodeSampleOperationFilter>();
        options.OperationFilter<BadgeOperationFilter>();
        return options;
    }
}