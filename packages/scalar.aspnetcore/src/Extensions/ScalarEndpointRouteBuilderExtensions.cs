using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Scalar.AspNetCore;

public static class ScalarEndpointRouteBuilderExtensions
{
    private const string DocumentName = "{documentName}";

    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapScalarApiReference(_ => { });
    }

    public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions> configureOptions)
    {
        var options = endpoints.ServiceProvider.GetService<IOptions<ScalarOptions>>()?.Value ?? new ScalarOptions();
        configureOptions(options);

        if (!options.EndpointPathPrefix.Contains(DocumentName))
        {
            throw new ArgumentException($"`EndpointPathPrefix` must define `{DocumentName}`.");
        }

        return endpoints.MapGet(options.EndpointPathPrefix, (string documentName) =>
            {
                var title = options.Title.Replace(DocumentName, documentName);
                var dataUrl = options.SetDataUrl?.Invoke(documentName) ?? $"/openapi/{documentName}.json";
                var configuration = JsonSerializer.Serialize(options.ToScalarConfiguration(), typeof(ScalarConfiguration), ScalaConfigurationSerializerContext.Default);

                return Results.Content(
                    $"""
                     <!doctype html>
                     <html>
                     <head>
                         <title>{title}</title>
                         <meta charset="utf-8" />
                         <meta name="viewport" content="width=device-width, initial-scale=1" />
                     </head>
                     <body>
                         <script id="api-reference" data-url="{dataUrl}"></script>
                         <script>
                         document.getElementById('api-reference').dataset.configuration = JSON.stringify({configuration})
                         </script>
                         <script src="{options.CdnUrl}"></script>
                     </body>
                     </html>
                     """, "text/html");
            })
            .ExcludeFromDescription();
    }
}