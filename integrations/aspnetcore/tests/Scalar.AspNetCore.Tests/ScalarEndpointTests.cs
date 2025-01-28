using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Scalar.AspNetCore.Tests;

public class ScalarEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task MapScalarApiReference_ShouldReturnIndex_WhenRequested()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar", TestContext.Current.CancellationToken);

        // Assert
        const string expected = $$"""
                                  <!doctype html>
                                  <html>
                                  <head>
                                      <title>Scalar API Reference</title>
                                      <meta charset="utf-8" />
                                      <meta name="viewport" content="width=device-width, initial-scale=1" />
                                      
                                  </head>
                                  <body>
                                      
                                      <script id="api-reference"></script>
                                      <script src="scalar.aspnetcore.js"></script>
                                      <script>
                                          const basePath = getBasePath('/scalar/');
                                          console.log(basePath)
                                          const openApiUrl = `${window.location.origin}${basePath}*`
                                          const reference = document.getElementById('api-reference')
                                          reference.dataset.url = openApiUrl;
                                          reference.dataset.configuration = JSON.stringify(*)
                                      </script>
                                      <script src="{{ScalarEndpointRouteBuilderExtensions.ScalarJavaScriptFile}}"></script>
                                  </body>
                                  </html>
                                  """;
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.ReplaceLineEndings().Should().Match(expected);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldRedirectToTrailingSlash_WhenRequestedWithoutTrailingSlash()
    {
        // Arrange
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        // Act
        var response = await client.GetAsync("/scalar", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location.Should().Be("scalar/");
    }


    [Theory]
    [InlineData("/scalar/scalar.aspnetcore.js", "getBasePath")]
#if CI_RUN
    [InlineData($"/scalar/{ScalarEndpointRouteBuilderExtensions.ScalarJavaScriptFile}", "@scalar/api-reference")]
#endif
    public async Task MapScalarApiReference_ShouldReturnStaticAssets_WhenRequested(string assetUrl, string expectedContent)
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync(assetUrl, TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.CacheControl.Should().NotBeNull();
        response.Headers.CacheControl!.NoCache.Should().BeTrue();
        response.Headers.ETag.Should().NotBeNull();
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.ReplaceLineEndings().Should().Contain(expectedContent);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldReturn304_WhenETagIsEqual()
    {
        // Arrange
        const string assetUrl = "/scalar/scalar.aspnetcore.js";
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync(assetUrl, TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var etag = response.Headers.ETag;
        etag.Should().NotBeNull();

        // Act
        client.DefaultRequestHeaders.IfNoneMatch.Add(etag!);
        response = await client.GetAsync(assetUrl, TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotModified);
    }


    [Fact]
    public async Task MapScalarApiReference_ShouldAddDefaultOpenApiDocument_WhenNotSpecified()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.ReplaceLineEndings().Should().Contain("/openapi/v1.json");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldAddDocumentNameFromRoute_WhenRequested()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar/v3", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.ReplaceLineEndings().Should().Contain("/openapi/v3.json").And.NotContain("/openapi/v1.json");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldUseDocumentProvider_WhenSpecified()
    {
        // Arranges
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.Configure<ScalarOptions>(options => options.WithDocumentNamesProvider(_ => ["v2"]));
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync("/scalar/", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.ReplaceLineEndings().Should().Contain("/openapi/v2.json").And.NotContain("/openapi/v1.json");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldUseCustomCdn_WhenRequested()
    {
        // Arrange
        const string cdnUrl = "/local-script.js";
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.Configure<ScalarOptions>(options => options.CdnUrl = cdnUrl);
            });
        }).CreateClient();

        // Act
        var index = await client.GetAsync($"/scalar", TestContext.Current.CancellationToken);

        // Assert
        index.StatusCode.Should().Be(HttpStatusCode.OK);
        var indexContent = await index.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        indexContent.ReplaceLineEndings().Should().Contain($"<script src=\"{cdnUrl}\"></script>");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldHandleCustomEndpointPrefix_WhenSpecified()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api-reference", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldReturn401_WhenAuthenticationRequired()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/auth/scalar", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldReturn200_WhenAuthenticated()
    {
        // Arrange
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Api-Key", "my-api-key");

        // Act
        var response = await client.GetAsync("/auth/scalar", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldNotCauseOptionsConflict_WhenMultipleEndpointsAreDefined()
    {
        // Arrange
        var localFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services => services.Configure<ScalarOptions>(o => o.WithTheme(ScalarTheme.Mars)));
            builder.Configure(options =>
            {
                options.UseRouting();
                options.UseEndpoints(endpoints =>
                {
                    endpoints.MapScalarApiReference((o, _) => o.WithTheme(ScalarTheme.Purple));
                    endpoints.MapScalarApiReference("/bar", o => o.WithTheme(ScalarTheme.Alternate));
                });
            });
        });
        var client = localFactory.CreateClient();

        // Act
        var scalarResponse = await client.GetAsync("/scalar", TestContext.Current.CancellationToken);
        var barResponse = await client.GetAsync("/bar", TestContext.Current.CancellationToken);

        // Assert
        scalarResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        barResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        localFactory.Services.GetRequiredService<IOptions<ScalarOptions>>().Value.Theme.Should().Be(ScalarTheme.Mars);
    }
    
    [Fact]
    public async Task MapScalarApiReference_ShouldReplaceDocumentNamePlaceholder_WhenOnlyOneDocumentWasAdded()
    {
        // Arrange
        var localFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.Configure(options =>
            {
                options.UseRouting();
                options.UseEndpoints(endpoints => endpoints.MapScalarApiReference(o => o.Title = "Scalar API Reference | {documentName}")
                );
            });
        });
        var client = localFactory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.ReplaceLineEndings().Should().Contain("<title>Scalar API Reference | v1</title>");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldHandleLegacyEndpointPathPrefix_WhenSpecified()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/legacy", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
