using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Scalar.Aspire.Service.Tests;

public class EndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
#if RELEASE
    [Fact]
#endif
#pragma warning disable xUnit1013
    public async Task MapStaticAssets_ShouldReturnStandaloneJs()
#pragma warning restore xUnit1013
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar.js", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.Should().Contain("@scalar/api-reference");
    }

    [Fact]
    public async Task MapApiReference_ShouldReturnError_WhenConfigNotProvided()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.Should().Contain($"API Reference configuration is not provided. Please set the {EnvironmentVariables.ApiReferenceConfig} environment variable.");
    }

    [Fact]
    public async Task MapApiReference_ShouldReturnIndex_WhenConfigProvided()
    {
        // Arrange
        var localFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        { EnvironmentVariables.ApiReferenceConfig, "{}" }
                    });
                });
            });
        var client = localFactory.CreateClient();

        // Act
        var response = await client.GetAsync("/", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        content.Should().Contain("<title>Scalar API Reference</title>");
    }

    [Fact]
    public async Task MapHealthChecks_ShouldReturnOk()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/health", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task MapScalarProxy_ShouldReturnNotFound_WhenNotConfigured()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar-proxy", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task MapOpenApiFiles_ShouldReturnNotFound_WhenFileNotMounted()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/openapi/nonexistent.yaml", TestContext.Current.CancellationToken);

        // Assert
        // The /openapi directory does not exist in the test environment, so the middleware is not registered
        // and the request falls through to a 404.
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task MapScalarProxy_ShouldReturnBadRequest_WhenConfigured()
    {
        // Arrange
        var localFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        { EnvironmentVariables.DefaultProxy, "true" }
                    });
                });
            });
        var client = localFactory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar-proxy", TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task MapScalarProxy_ShouldUseTargetAuthorityForHostHeader_ByDefault()
    {
        // Arrange
        var (targetServerApp, targetServer) = await StartHostEchoServerAsync();
        await using var _ = targetServerApp;
        var localFactory = CreateProxyFactory();
        var client = localFactory.CreateClient();
        var targetUrl = new Uri(targetServer, "/host");
        var request = new HttpRequestMessage(HttpMethod.Get, $"/scalar-proxy?scalar_url={Uri.EscapeDataString(targetUrl.ToString())}");
        request.Headers.Host = "incoming.example";

        // Act
        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var hostHeader = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        hostHeader.Should().Be(targetServer.Authority);
    }

    [Fact]
    public async Task MapScalarProxy_ShouldForwardIncomingHostHeader_WhenConfigured()
    {
        // Arrange
        var (targetServerApp, targetServer) = await StartHostEchoServerAsync();
        await using var _ = targetServerApp;
        var localFactory = CreateProxyFactory(forwardOriginalHostHeader: true);
        var client = localFactory.CreateClient();
        var targetUrl = new Uri(targetServer, "/host");
        var request = new HttpRequestMessage(HttpMethod.Get, $"/scalar-proxy?scalar_url={Uri.EscapeDataString(targetUrl.ToString())}");
        request.Headers.Host = "incoming.example";

        // Act
        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var hostHeader = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        hostHeader.Should().Be("incoming.example");
    }

    private static WebApplicationFactory<Program> CreateProxyFactory(bool forwardOriginalHostHeader = false) =>
        new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        { EnvironmentVariables.DefaultProxy, "true" },
                        { EnvironmentVariables.ForwardOriginalHostHeader, forwardOriginalHostHeader.ToString() }
                    });
                });
            });

    private static async Task<(WebApplication App, Uri BaseAddress)> StartHostEchoServerAsync()
    {
        var appBuilder = WebApplication.CreateBuilder();
        appBuilder.WebHost.UseUrls("http://127.0.0.1:0");
        var app = appBuilder.Build();
        app.MapGet("/host", (HttpRequest request) => request.Host.Value);

        await app.StartAsync(TestContext.Current.CancellationToken);
        var address = app.Urls.Single();

        return (app, new Uri(address));
    }
}
