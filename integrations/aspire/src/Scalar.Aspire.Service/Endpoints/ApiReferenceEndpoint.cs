using System.Diagnostics.CodeAnalysis;
using System.Text;

namespace Scalar.Aspire.Service.Endpoints;

internal static class ApiReferenceEndpoint
{
    internal static void MapApiReference(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(RouteDefaults.ApiReferenceEndpoint, HandleApiReference);
    }

    private static IResult HandleApiReference(IConfiguration configuration)
    {
        var rawReferenceConfiguration = configuration.GetValue<string>(ApiReferenceConfig);
        if (string.IsNullOrEmpty(rawReferenceConfiguration))
        {
            return Results.Content(
                $"API Reference configuration is not provided. Please set the {ApiReferenceConfig} environment variable.",
                "text/plain", statusCode: StatusCodes.Status500InternalServerError);
        }

        // Decode the configuration if it's Base64 encoded
        var configurationToUse = TryDecodeBase64(rawReferenceConfiguration, out var decodedConfig) ? decodedConfig : rawReferenceConfiguration;

        var cdnUrl = configuration.GetValue<string>(CdnUrl);
        return Results.Content(
            $"""
             <!doctype html>
             <html>
               <head>
                 <title>Scalar API Reference</title>
                 <meta charset="utf-8" />
                 <link rel="icon" type="image/svg" href="/favicon.svg" />
                 <meta name="viewport" content="width=device-width, initial-scale=1" />
               </head>
               <body>
                 <div id="app"></div>
                 <script src="{cdnUrl}"></script>
                 <script>
                   const configuration = {configurationToUse}
                   Scalar.createApiReference('#app', configuration)
                 </script>
               </body>
             </html>
             """, "text/html");
    }

    private static bool TryDecodeBase64(string input, [NotNullWhen(true)] out string? decoded)
    {
        decoded = null;

        try
        {
            var bytes = Convert.FromBase64String(input);
            decoded = Encoding.UTF8.GetString(bytes);
            return true;
        }
        catch
        {
            return false;
        }
    }
}