using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Microsoft;

#if NET10_0_OR_GREATER
internal sealed class ScalarDocumentProvider(IServiceProvider serviceProvider) : IScalarDocumentProvider
{
    public async Task<string> GetDocumentContentAsync(string documentName, CancellationToken cancellationToken)
    {
        var documentProvider = serviceProvider.GetKeyedService<IOpenApiDocumentProvider>(documentName);
        if (documentProvider is null)
        {
            throw new InvalidOperationException($"No OpenAPI document provider found for document name '{documentName}'.");
        }

        var document = await documentProvider.GetOpenApiDocumentAsync(cancellationToken);
        return await document.SerializeAsJsonAsync(OpenApiSpecVersion.OpenApi3_1, cancellationToken);
    }
}

#endif