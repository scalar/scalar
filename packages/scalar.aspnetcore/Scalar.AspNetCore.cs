using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Scalar.AspNetCore
{
    public static class OpenApiEndpointRouteBuilderExtensions
    {
        private const string DOCUMENT_NAME = "{documentName}";

        private static readonly JsonSerializerOptions JsonSerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints)
        {
            return endpoints.MapScalarApiReference(_ => { });
        }
        public static IEndpointConventionBuilder MapScalarApiReference(this IEndpointRouteBuilder endpoints, Action<ScalarOptions> configureOptions)
        {
            var options = new ScalarOptions();
            configureOptions(options);

            if (!options.EndpointPathPrefix.Contains(DOCUMENT_NAME))
                throw new ArgumentException($"`EndpointPathPrefix` must define `{DOCUMENT_NAME}`.");

            return endpoints.MapGet(options.EndpointPathPrefix, (string documentName) =>
            {
                var title = options.Title.Replace(DOCUMENT_NAME, documentName);
                var dataUrl = options.SetDataUrl?.Invoke(documentName) ?? $"/openapi/{documentName}.json";
                var configuration = JsonSerializer.Serialize(new ScalaConfiguration(options), JsonSerializerOptions);

                return Results.Content(
                    $$"""
                        <!doctype html>
                        <html>
                        <head>
                            <title>{{title}}</title>
                            <meta charset="utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1" />
                        </head>
                        <body>
                            <script id="api-reference" data-url="{{dataUrl}}"></script>
                            <script>
                            var configuration = {{configuration}}

                            document.getElementById('api-reference').dataset.configuration = JSON.stringify(configuration)
                            </script>
                            <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
                        </body>
                        </html>
                        """, "text/html");
            })
            .ExcludeFromDescription();
        }
    }
}
