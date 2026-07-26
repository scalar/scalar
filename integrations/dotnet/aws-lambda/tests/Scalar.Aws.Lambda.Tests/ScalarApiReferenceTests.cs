using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.TestUtilities;
using Microsoft.Extensions.DependencyInjection;
using Scalar.Aws.Lambda;

namespace Scalar.Aws.Lambda.Tests;

/// <summary>
/// Exercises the full pipeline through the DI-registered <see cref="IScalarApiReference" /> implementation,
/// simulating requests coming from an Amazon API Gateway HTTP API (payload format 2.0).
/// </summary>
public class ScalarApiReferenceTests
{
    private static async Task<APIGatewayHttpApiV2ProxyResponse> RunAsync(
        string rawPath,
        string? routeRemainder,
        string? stage = "$default",
        Action<ScalarOptions>? configure = null,
        string? acceptEncoding = null,
        string? ifNoneMatch = null,
        Action<ScalarOptions, APIGatewayHttpApiV2ProxyRequest>? configureOptions = null,
        bool includePathParameters = true)
    {
        var services = new ServiceCollection();
        services.AddScalarApiReference(configure ?? (_ => { }));
        await using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var scalar = scope.ServiceProvider.GetRequiredService<IScalarApiReference>();

        var headers = new Dictionary<string, string>();
        if (acceptEncoding is not null)
        {
            headers["accept-encoding"] = acceptEncoding;
        }

        if (ifNoneMatch is not null)
        {
            headers["if-none-match"] = ifNoneMatch;
        }

        var request = new APIGatewayHttpApiV2ProxyRequest
        {
            RawPath = rawPath,
            Headers = headers,
            PathParameters = includePathParameters ? new Dictionary<string, string> { ["proxy"] = routeRemainder ?? string.Empty } : null,
            RequestContext = new APIGatewayHttpApiV2ProxyRequest.ProxyRequestContext
            {
                Stage = stage!
            }
        };

        var context = new TestLambdaContext();

        return await scalar.HandleAsync(request, context, configureOptions);
    }

    private static string? HeaderValue(APIGatewayHttpApiV2ProxyResponse response, string name) =>
        response.Headers is not null && response.Headers.TryGetValue(name, out var value) ? value : null;

    [Fact]
    public async Task HandleAsync_ShouldReturnIndex_WhenIndexRequested()
    {
        var response = await RunAsync("/scalar/", string.Empty);

        response.StatusCode.Should().Be(200);
        HeaderValue(response, "Content-Type").Should().Be("text/html");
        response.Body.Should().Contain("<div id=\"app\"></div>").And.Contain("openapi/v1.json");
        response.Body.Should().Contain("'%2Fscalar%2F'");
        response.IsBase64Encoded.Should().BeFalse();
    }

    [Fact]
    public async Task HandleAsync_ShouldTreatMissingPathParameters_AsIndexRequest()
    {
        // Edge case: a request invoked without going through API Gateway proxy integration.
        var response = await RunAsync("/scalar/", string.Empty, includePathParameters: false);

        response.StatusCode.Should().Be(200);
        response.Body.Should().Contain("<div id=\"app\"></div>");
    }

    [Fact]
    public async Task HandleAsync_ShouldNotLeakDefaultStageIntoClientPath()
    {
        var response = await RunAsync("/scalar/", string.Empty, stage: "$default");

        response.Body.Should().Contain("'%2Fscalar%2F'");
    }

    [Fact]
    public async Task HandleAsync_ShouldAutoDetectNamedStage_AndStripFromClientPath()
    {
        var response = await RunAsync("/prod/scalar/", string.Empty, stage: "prod");

        response.Body.Should().Contain("'%2Fscalar%2F'");
        response.Body.Should().NotContain("'%2Fprod%2Fscalar%2F'");
    }

    [Fact]
    public async Task HandleAsync_ShouldRespectExplicitRoutePrefix_OverStageAutoDetection()
    {
        var response = await RunAsync(
            "/custom/scalar/",
            string.Empty,
            stage: "prod",
            configure: options => options.RoutePrefix = "custom");

        response.Body.Should().Contain("'%2Fscalar%2F'");
        response.Body.Should().NotContain("'%2Fcustom%2Fscalar%2F'");
        response.Body.Should().NotContain("'%2Fprod%2Fscalar%2F'");
    }

    [Fact]
    public async Task HandleAsync_ShouldUseDocumentNameFromRoute_WhenProvided()
    {
        var response = await RunAsync("/scalar/v3", "v3");

        response.Body.Should().Contain("openapi/v3.json");
    }

    [Fact]
    public async Task HandleAsync_ShouldServeStaticAsset_WhenRequested()
    {
        var response = await RunAsync("/scalar/scalar.aws.lambda.js", "scalar.aws.lambda.js");

        response.StatusCode.Should().Be(200);
        HeaderValue(response, "Content-Type").Should().Be("text/javascript");
        HeaderValue(response, "ETag").Should().NotBeNullOrEmpty();
        HeaderValue(response, "Cache-Control").Should().Be("no-cache");
        HeaderValue(response, "Vary").Should().Be("Accept-Encoding");
        response.Body.Should().Contain("getBasePath");
        response.IsBase64Encoded.Should().BeFalse();
    }

    [Fact]
    public async Task HandleAsync_ShouldServeStandaloneJavaScriptAsset()
    {
        var response = await RunAsync("/scalar/scalar.js", "scalar.js");

        response.StatusCode.Should().Be(200);
        HeaderValue(response, "Content-Type").Should().Be("text/javascript");
        response.Body.Should().Contain("createApiReference");
    }

    [Fact]
    public async Task HandleAsync_ShouldReturn304_WhenETagMatches()
    {
        var first = await RunAsync("/scalar/favicon.svg", "favicon.svg");
        var etag = HeaderValue(first, "ETag");
        etag.Should().NotBeNullOrEmpty();

        var second = await RunAsync("/scalar/favicon.svg", "favicon.svg", ifNoneMatch: etag);

        second.StatusCode.Should().Be(304);
        HeaderValue(second, "ETag").Should().Be(etag);
        second.Body.Should().BeNullOrEmpty();
    }

    [Fact]
    public async Task HandleAsync_ShouldRedirect_WhenIndexRequestedWithoutTrailingSlash()
    {
        var response = await RunAsync("/scalar", string.Empty);

        response.StatusCode.Should().Be(302);
        HeaderValue(response, "Location").Should().Be("scalar/");
    }

    [Fact]
    public async Task HandleAsync_ShouldEmitNonce_WhenConfigured()
    {
        const string nonce = "my-nonce";
        var response = await RunAsync("/scalar/", string.Empty, configure: options => options.Nonce = nonce);

        response.Body.Should().Contain($" nonce=\"{nonce}\"");
        HeaderValue(response, "Cache-Control").Should().Be("no-store");
    }

    [Fact]
    public async Task HandleAsync_ShouldAdvertiseVary_WhenGzipAccepted()
    {
        var response = await RunAsync("/scalar/scalar.js", "scalar.js", acceptEncoding: "gzip, deflate, br");

        response.StatusCode.Should().Be(200);
        HeaderValue(response, "Vary").Should().Be("Accept-Encoding");
    }

    [Fact]
    public async Task HandleAsync_ShouldApplyPerRequestConfigureOptions()
    {
        var response = await RunAsync("/scalar/", string.Empty, configureOptions: (options, _) => options.Title = "Per-request title");

        response.Body.Should().Contain("<title>Per-request title</title>");
    }

    [Fact]
    public async Task HandleAsync_ShouldReadHeaders_CaseInsensitively()
    {
        // API Gateway lowercases header names for HTTP APIs, but direct invocations might not.
        var services = new ServiceCollection();
        services.AddScalarApiReference();
        await using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var scalar = scope.ServiceProvider.GetRequiredService<IScalarApiReference>();

        var first = await RunAsync("/scalar/favicon.svg", "favicon.svg");
        var etag = HeaderValue(first, "ETag");

        var request = new APIGatewayHttpApiV2ProxyRequest
        {
            RawPath = "/scalar/favicon.svg",
            Headers = new Dictionary<string, string> { ["If-None-Match"] = etag! },
            PathParameters = new Dictionary<string, string> { ["proxy"] = "favicon.svg" },
            RequestContext = new APIGatewayHttpApiV2ProxyRequest.ProxyRequestContext { Stage = "$default" }
        };

        var response = await scalar.HandleAsync(request, new TestLambdaContext());

        response.StatusCode.Should().Be(304);
    }
}
