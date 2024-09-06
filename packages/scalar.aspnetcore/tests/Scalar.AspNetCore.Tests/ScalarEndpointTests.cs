using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Tests;

public class ScalarEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task MapScalarApiReference_ShouldReturnIndex_WhenRequested()
    {
        // Arrange
        var client = factory.CreateClient();
        // Act
        var response = await client.GetAsync("/scalar/v1");

        // Assert
        const string expected = """
                                <!doctype html>
                                <html>
                                <head>
                                    <title>Scalar API Reference -- v1</title>
                                    <meta charset="utf-8" />
                                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                                </head>
                                <body>
                                    <script id="api-reference" data-url="/openapi/v1.json"></script>
                                    <script>
                                    document.getElementById('api-reference').dataset.configuration = JSON.stringify(*)
                                    </script>
                                    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
                                </body>
                                </html>
                                """;
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ReplaceLineEndings().Should().Match(expected);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldReturnDefaultConfiguration_WhenNotSpecified()
    {
        // Arrange
        var configuration = new ScalarOptions().ToScalarConfiguration();
        var expectedConfiguration = JsonSerializer.Serialize(configuration, typeof(ScalarConfiguration), ScalaConfigurationSerializerContext.Default);
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar/v1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ReplaceLineEndings().Should().Contain(expectedConfiguration);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldUseCustomCdn_WhenSpecified()
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
        var response = await client.GetAsync("/scalar/v1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ReplaceLineEndings().Should().Contain($"<script src=\"{cdnUrl}\"></script>");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldHandleCustom_WhenSpecified()
    {
        // Arrange
        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.Configure<ScalarOptions>(options => options.EndpointPathPrefix = "/custom-path/{documentName}");
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync("/custom-path/v1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}