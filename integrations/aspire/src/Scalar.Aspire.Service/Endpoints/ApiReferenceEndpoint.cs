namespace Scalar.Aspire.Service.Endpoints;

internal static class ApiReferenceEndpoint
{
    internal static void MapApiReference(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(RouteDefaults.ApiReferenceEndpoint, HandleApiReference);
    }

    private static IResult HandleApiReference()
    {
        var configuration = Environment.GetEnvironmentVariable(ApiReferenceConfig);
        if (string.IsNullOrEmpty(configuration))
        {
            return Results.Content(
                "API Reference configuration is not provided. Please set the API_REFERENCE_CONFIG environment variable.",
                "text/plain", statusCode: StatusCodes.Status500InternalServerError);
        }

        var cdnUrl = Environment.GetEnvironmentVariable(CdnUrl);
        return Results.Content(
            $"""
             <!doctype html>
             <html>
               <head>
                 <title>Scalar API Reference</title>
                 <meta charset="utf-8" />
                 <link rel="icon" type="image/png" href="/favicon.png" />
                 <meta name="viewport" content="width=device-width, initial-scale=1" />
               </head>
               <body>
                 <div id="app"></div>
                 <script src="{cdnUrl}"></script>
                 <script>
                   const configuration = {configuration}
                   Scalar.createApiReference('#app', configuration)
                 </script>
               </body>
             </html>
             """, "text/html");
    }
}