using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

namespace Scalar.Aspire.Service.Extensions;

internal static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Serves static OpenAPI files mounted at the <see cref="RouteDefaults.StaticFilesEndpoint"/> path.
    /// Files are only served if the directory exists, which it will when files are bind-mounted by the Scalar Aspire host.
    /// </summary>
    internal static void UseOpenApiFiles(this WebApplication app)
    {
        var openApiDirectory = new DirectoryInfo(StaticFilesEndpoint);
        if (!openApiDirectory.Exists)
        {
            return;
        }

        // Register YAML content types, which are not included in the default provider.
        var contentTypeProvider = new FileExtensionContentTypeProvider();
        contentTypeProvider.Mappings[".yaml"] = "application/yaml";
        contentTypeProvider.Mappings[".yml"] = "application/yaml";

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(openApiDirectory.FullName),
            RequestPath = StaticFilesEndpoint,
            ContentTypeProvider = contentTypeProvider
        });
    }
}
