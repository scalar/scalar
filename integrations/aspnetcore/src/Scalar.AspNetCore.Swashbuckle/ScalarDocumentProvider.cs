using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Extensions;
using Swashbuckle.AspNetCore.Swagger;

namespace Scalar.AspNetCore.Swashbuckle;

internal sealed class ScalarDocumentProvider(IServiceProvider serviceProvider) : IScalarDocumentProvider
{
    public async Task<string> GetDocumentContentAsync(string documentName, CancellationToken cancellationToken)
    {
        var documentProvider = serviceProvider.GetRequiredService<IAsyncSwaggerProvider>();
        var document = await documentProvider.GetSwaggerAsync(documentName);
        return document.SerializeAsJson(OpenApiSpecVersion.OpenApi3_0);
    }
}