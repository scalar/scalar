using System.Text;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Microsoft.Extensions.Options;

namespace Scalar.Aws.Lambda;

/// <inheritdoc />
internal sealed class ScalarApiReference(IOptionsSnapshot<ScalarOptions> optionsSnapshot) : IScalarApiReference
{
    private const string RouteRemainderKey = "proxy";
    private const string DefaultStageName = "$default";

    /// <inheritdoc />
    public async Task<APIGatewayHttpApiV2ProxyResponse> HandleAsync(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context, Action<ScalarOptions, APIGatewayHttpApiV2ProxyRequest>? configureOptions = null)
    {
        var options = optionsSnapshot.Value;
        configureOptions?.Invoke(options, request);

        ApplyRoutePrefix(options, request);

        var requestPath = request.RawPath ?? "/";
        var remainder = GetRouteRemainder(request);
        var gzipAccepted = AcceptsGzip(request.Headers);
        var ifNoneMatch = GetHeader(request.Headers, "if-none-match");

        var result = ScalarRequestProcessor.Process(options, requestPath, remainder, gzipAccepted, ifNoneMatch);

        return await BuildResponseAsync(result);
    }

    /// <summary>
    /// Auto-detects the API Gateway stage and folds it into <see cref="ScalarOptions.RoutePrefix" />, unless the
    /// caller already set it explicitly. HTTP APIs embed the stage name in <c>RawPath</c> for any named stage
    /// (but not for the <c>$default</c> stage).
    /// </summary>
    private static void ApplyRoutePrefix(ScalarOptions options, APIGatewayHttpApiV2ProxyRequest request)
    {
        if (options.RoutePrefix is not null)
        {
            return;
        }

        var stage = request.RequestContext?.Stage;
        if (!string.IsNullOrEmpty(stage) && !string.Equals(stage, DefaultStageName, StringComparison.Ordinal))
        {
            options.RoutePrefix = stage;
        }
    }

    private static async Task<APIGatewayHttpApiV2ProxyResponse> BuildResponseAsync(ScalarRenderResult result)
    {
        var response = new APIGatewayHttpApiV2ProxyResponse
        {
            Headers = new Dictionary<string, string>()
        };

        if (result.RedirectLocation is not null)
        {
            response.StatusCode = 302;
            response.Headers["Location"] = result.RedirectLocation;
            return response;
        }

        if (result.NotModified)
        {
            response.StatusCode = 304;
            AddIfNotNull(response, "ETag", result.ETag);
            AddIfNotNull(response, "Cache-Control", result.CacheControl);
            if (result.VaryAcceptEncoding)
            {
                response.Headers["Vary"] = "Accept-Encoding";
            }

            return response;
        }

        if (result.StatusCode == 404)
        {
            response.StatusCode = 404;
            return response;
        }

        AddIfNotNull(response, "Cache-Control", result.CacheControl);
        if (result.VaryAcceptEncoding)
        {
            response.Headers["Vary"] = "Accept-Encoding";
        }

        AddIfNotNull(response, "ETag", result.ETag);
        AddIfNotNull(response, "Content-Type", result.ContentType);

        response.StatusCode = 200;

        if (result.Html is not null)
        {
            response.Body = result.Html;
            response.IsBase64Encoded = false;
        }
        else if (result.AssetStream is not null)
        {
            await using (result.AssetStream)
            {
                using var buffer = new MemoryStream();
                await result.AssetStream.CopyToAsync(buffer);
                var bytes = buffer.ToArray();

                if (result.ContentEncoding is not null)
                {
                    // The stream holds gzip-compressed binary content. API Gateway (and the Lambda response
                    // contract) require binary bodies to be base64-encoded.
                    response.Headers["Content-Encoding"] = result.ContentEncoding;
                    response.Body = Convert.ToBase64String(bytes);
                    response.IsBase64Encoded = true;
                }
                else
                {
                    response.Body = Encoding.UTF8.GetString(bytes);
                    response.IsBase64Encoded = false;
                }
            }
        }

        return response;
    }

    private static string? GetRouteRemainder(APIGatewayHttpApiV2ProxyRequest request)
    {
        return request.PathParameters is not null && request.PathParameters.TryGetValue(RouteRemainderKey, out var value)
            ? value
            : null;
    }

    private static void AddIfNotNull(APIGatewayHttpApiV2ProxyResponse response, string name, string? value)
    {
        if (value is not null)
        {
            response.Headers![name] = value;
        }
    }

    private static bool AcceptsGzip(IDictionary<string, string>? headers)
    {
        var value = GetHeader(headers, "accept-encoding");
        return value is not null && value.Contains("gzip", StringComparison.OrdinalIgnoreCase);
    }

    private static string? GetHeader(IDictionary<string, string>? headers, string name)
    {
        if (headers is null)
        {
            return null;
        }

        foreach (var (key, value) in headers)
        {
            if (string.Equals(key, name, StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }
        }

        return null;
    }
}
