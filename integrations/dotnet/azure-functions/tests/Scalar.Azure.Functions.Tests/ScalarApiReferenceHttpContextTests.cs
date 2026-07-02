using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Scalar.Azure.Functions;

namespace Scalar.Azure.Functions.Tests;

/// <summary>
/// Exercises the full pipeline (request processor + ASP.NET Core integration adapter + shared rendering core)
/// through the <see cref="IScalarApiReference.HandleAsync(HttpContext, System.Action{ScalarOptions, HttpContext})" />
/// entry point using a <see cref="DefaultHttpContext" />.
/// </summary>
public class ScalarApiReferenceHttpContextTests
{
    private static async Task<(DefaultHttpContext Context, string Body)> RunAsync(
        string path,
        string? routeRemainder,
        Action<ScalarOptions>? configure = null,
        Action<DefaultHttpContext>? prepare = null)
    {
        var services = new ServiceCollection();
        services.AddScalarApiReference(configure ?? (_ => { }));
        await using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var scalar = scope.ServiceProvider.GetRequiredService<IScalarApiReference>();

        var context = new DefaultHttpContext();
        context.Request.Path = path;
        context.Request.RouteValues["path"] = routeRemainder;
        prepare?.Invoke(context);
        var body = new MemoryStream();
        context.Response.Body = body;

        await scalar.HandleAsync(context);

        body.Position = 0;
        using var reader = new StreamReader(body);
        var text = await reader.ReadToEndAsync(TestContext.Current.CancellationToken);
        return (context, text);
    }

    [Fact]
    public async Task HandleAsync_ShouldReturnIndex_WhenIndexRequested()
    {
        var (context, body) = await RunAsync("/api/scalar/", string.Empty);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        context.Response.ContentType.Should().StartWith("text/html");
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
    public async Task HandleAsync_ShouldServeStaticAsset_WhenRequested()
    {
        var (context, body) = await RunAsync("/api/scalar/scalar.azure.functions.js", "scalar.azure.functions.js");

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        context.Response.ContentType.Should().Be("text/javascript");
        context.Response.Headers.ETag.ToString().Should().NotBeNullOrEmpty();
        context.Response.Headers.CacheControl.ToString().Should().Be("no-cache");
        body.Should().Contain("getBasePath");
    }

    [Fact]
    public async Task HandleAsync_ShouldServeStandaloneJavaScriptAsset()
    {
        var (context, body) = await RunAsync("/api/scalar/scalar.js", "scalar.js");

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        context.Response.ContentType.Should().Be("text/javascript");
        body.Should().Contain("createApiReference");
    }

    [Fact]
    public async Task HandleAsync_ShouldReturn304_WhenETagMatches()
    {
        var (firstContext, _) = await RunAsync("/api/scalar/favicon.svg", "favicon.svg");
        var etag = firstContext.Response.Headers.ETag.ToString();
        etag.Should().NotBeNullOrEmpty();

        var (secondContext, _) = await RunAsync("/api/scalar/favicon.svg", "favicon.svg", prepare: ctx => ctx.Request.Headers.IfNoneMatch = etag);

        secondContext.Response.StatusCode.Should().Be(StatusCodes.Status304NotModified);
    }

    [Fact]
    public async Task HandleAsync_ShouldRedirect_WhenIndexRequestedWithoutTrailingSlash()
    {
        var (context, _) = await RunAsync("/api/scalar", string.Empty);

        context.Response.StatusCode.Should().Be(StatusCodes.Status302Found);
        context.Response.Headers.Location.ToString().Should().Be("scalar/");
    }

    [Fact]
    public async Task HandleAsync_ShouldEmitNonce_WhenConfigured()
    {
        const string nonce = "my-nonce";
        var (context, body) = await RunAsync("/api/scalar/", string.Empty, configure: options => options.Nonce = nonce);

        body.Split($" nonce=\"{nonce}\"").Length.Should().Be(4); // 3 occurrences => 4 segments
        context.Items[ScalarOptions.NonceHttpContextItemKey].Should().Be(nonce);
        context.Response.Headers.CacheControl.ToString().Should().Be("no-store");
    }

    [Fact]
    public async Task HandleAsync_ShouldUseCustomBundleUrl_WhenConfigured()
    {
        const string bundleUrl = "/local-script.js";
        var (_, body) = await RunAsync("/api/scalar/", string.Empty, configure: options => options.BundleUrl = bundleUrl);

        body.Should().Contain($"<script src=\"{bundleUrl}\">");
    }
}
