using System.Net;
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
        var response = await client.GetAsync("/standalone.js", TestContext.Current.CancellationToken);

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
}