using Microsoft.AspNetCore.OpenApi;

namespace Scalar.AspNetCore;

/// <summary>
/// Scalar extensions for <see cref="OpenApiOptions" />.
/// </summary>
public static class OpenApiOptionsExtensions
{
    /// <summary>
    /// Adds required Scalar transformers to the <see cref="OpenApiOptions" />.
    /// </summary>
    /// <param name="options"><see cref="OpenApiOptions" />.</param>
    public static OpenApiOptions AddScalarTransformers(this OpenApiOptions options)
    {
        options.AddOperationTransformer<StabilityOpenApiOperationTransformer>();
        options.AddOperationTransformer<ExcludeFromApiReferenceOpenApiOperationTransformer>();
        options.AddDocumentTransformer<ExcludeFromApiReferenceOpenApiDocumentTransformer>();

        return options;
    }
}