using System.Net;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.DependencyInjection;
using Scalar.Azure.Functions;
using Scalar.Azure.Functions.Tests.TestDoubles;

namespace Scalar.Azure.Functions.Tests;

/// <summary>
/// Exercises the full pipeline through the built-in Azure Functions HTTP model
/// (<see cref="IScalarApiReference.HandleAsync(HttpRequestData, System.Action{ScalarOptions, HttpRequestData})" />).
/// This path constructs the response by hand (status codes, headers, stream copying) and is otherwise untested.
/// </summary>
public class ScalarApiReferenceHttpRequestDataTests
{
    private static async Task<(HttpResponseData Response, string Body)> RunAsync(
        string path,
        object? routeRemainder,
        Action<ScalarOptions>? configure = null,
        string? acceptEncoding = null,
        string? ifNoneMatch = null,
        Action<ScalarOptions, HttpRequestData>? configureOptions = null)
    {
        var services = new ServiceCollection();
        services.AddScalarApiReference(configure ?? (_ => { }));
        await using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var scalar = scope.ServiceProvider.GetRequiredService<IScalarApiReference>();

        var bindingData = new Dictionary<string, object?> { ["path"] = routeRemainder };
        var functionContext = new FakeFunctionContext(bindingData)
        {
            InstanceServices = scope.ServiceProvider
        };

        var headers = new HttpHeadersCollection();
        if (acceptEncoding is not null)
        {
            headers.Add("Accept-Encoding", acceptEncoding);
        }

        if (ifNoneMatch is not null)
        {
            headers.Add("If-None-Match", ifNoneMatch);
        }

        var request = new FakeHttpRequestData(functionContext, new Uri($"http://localhost{path}"), headers);

        var response = await scalar.HandleAsync(request, configureOptions);

        response.Body.Position = 0;
        using var reader = new StreamReader(response.Body);
        var text = await reader.ReadToEndAsync(TestContext.Current.CancellationToken);
        return (response, text);
    }

    private static string? HeaderValue(HttpResponseData response, string name) =>
        response.Headers.TryGetValues(name, out var values) ? string.Join(",", values) : null;

    [Fact]
    public async Task HandleAsync_ShouldReturnIndex_WhenIndexRequested()
    {
        var (response, body) = await RunAsync("/api/scalar/", string.Empty);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        HeaderValue(response, "Content-Type").Should().Be("text/html");
        body.Should().Contain("<div id=\"app\"></div>").And.Contain("openapi/v1.json");
        body.Should().Contain("'%2Fscalar%2F'").And.NotContain("'%2Fapi%2Fscalar%2F'");
    }

    [Fact]
    public async Task HandleAsync_ShouldUseDocumentNameFromRoute_WhenProvided()
    {
        var (_, body) = await RunAsync("/api/scalar/v3", "v3");

        body.Should().Contain("openapi/v3.json");
    }

    [Fact]
    public async Task HandleAsync_ShouldNormalizeJsonQuotedRouteRemainder()
    {
        // Some hosts surface the catch-all binding value JSON-quoted; the adapter must strip the quotes.
        var (_, body) = await RunAsync("/api/scalar/v3", "\"v3\"");

        body.Should().Contain("openapi/v3.json");
    }

    [Fact]
    public async Task HandleAsync_ShouldServeStaticAsset_WhenRequested()
    {
        var (response, body) = await RunAsync("/api/scalar/scalar.azure.functions.js", "scalar.azure.functions.js");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        HeaderValue(response, "Content-Type").Should().Be("text/javascript");
        HeaderValue(response, "ETag").Should().NotBeNullOrEmpty();
        HeaderValue(response, "Cache-Control").Should().Be("no-cache");
        HeaderValue(response, "Vary").Should().Be("Accept-Encoding");
        body.Should().Contain("getBasePath");
    }

    [Fact]
    public async Task HandleAsync_ShouldServeStandaloneJavaScriptAsset()
    {
        var (response, body) = await RunAsync("/api/scalar/scalar.js", "scalar.js");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        HeaderValue(response, "Content-Type").Should().Be("text/javascript");
        body.Should().Contain("createApiReference");
    }

    [Fact]
    public async Task HandleAsync_ShouldReturn304_WhenETagMatches()
    {
        var (first, _) = await RunAsync("/api/scalar/favicon.svg", "favicon.svg");
        var etag = HeaderValue(first, "ETag");
        etag.Should().NotBeNullOrEmpty();

        var (second, body) = await RunAsync("/api/scalar/favicon.svg", "favicon.svg", ifNoneMatch: etag);

        second.StatusCode.Should().Be(HttpStatusCode.NotModified);
        HeaderValue(second, "ETag").Should().Be(etag);
        body.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_ShouldRedirect_WhenIndexRequestedWithoutTrailingSlash()
    {
        var (response, _) = await RunAsync("/api/scalar", string.Empty);

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        HeaderValue(response, "Location").Should().Be("scalar/");
    }

    [Fact]
    public async Task HandleAsync_ShouldEmitNonce_WhenConfigured()
    {
        const string nonce = "my-nonce";
        var (response, body) = await RunAsync("/api/scalar/", string.Empty, configure: options => options.Nonce = nonce);

        body.Should().Contain($" nonce=\"{nonce}\"");
        HeaderValue(response, "Cache-Control").Should().Be("no-store");
    }

    [Fact]
    public async Task HandleAsync_ShouldAdvertiseVary_WhenGzipAccepted()
    {
        var (response, _) = await RunAsync("/api/scalar/scalar.js", "scalar.js", acceptEncoding: "gzip, deflate, br");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        HeaderValue(response, "Vary").Should().Be("Accept-Encoding");
    }

    [Fact]
    public async Task HandleAsync_ShouldApplyPerRequestConfigureOptions()
    {
        var (_, body) = await RunAsync("/api/scalar/", string.Empty, configureOptions: (options, _) => options.Title = "Per-request title");

        body.Should().Contain("<title>Per-request title</title>");
    }
}
