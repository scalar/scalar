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
        const string expected = $"""
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
                                     <script src="{ScalarEndpointRouteBuilderExtensions.ScalarJavaScriptFile}"></script>
                                 </body>
                                 </html>
                                 """;
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ReplaceLineEndings().Should().Match(expected);
    }

#if CI_RUN
    [Fact]
    public async Task MapScalarApiReference_ShouldReturnStandaloneApiReference_WhenRequested()
    {
        // Arrange
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/scalar/{ScalarEndpointRouteBuilderExtensions.ScalarJavaScriptFile}");

        // Assert
        const string expected = "@scalar/api-reference";
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ReplaceLineEndings().Should().Contain(expected);
    }
#endif


    [Fact]
    public async Task MapScalarApiReference_ShouldReturnDefaultConfiguration_WhenNotSpecified()
    {
        // Arrange
        var configuration = new ScalarOptions().ToScalarConfiguration();
        var expectedConfiguration = JsonSerializer.Serialize(configuration, ScalaConfigurationSerializerContext.Default.ScalarConfiguration);
        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/scalar/v1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ReplaceLineEndings().Should().Contain(expectedConfiguration);
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldUseCustomCdnAndNotHandleStandaloneApiReference_WhenRequested()
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
        var index = await client.GetAsync("/scalar/v1");
        var standalone = await client.GetAsync($"/scalar/{ScalarEndpointRouteBuilderExtensions.ScalarJavaScriptFile}");

        // Assert
        index.StatusCode.Should().Be(HttpStatusCode.OK);
        var indexContent = await index.Content.ReadAsStringAsync();
        indexContent.ReplaceLineEndings().Should().Contain($"<script src=\"{cdnUrl}\"></script>");
        standalone.StatusCode.Should().Be(HttpStatusCode.OK);
        var standaloneContent = await standalone.Content.ReadAsStringAsync();
        standaloneContent.ReplaceLineEndings().Should().NotContain("DO NOT REMOVE ME");
    }

    [Fact]
    public async Task MapScalarApiReference_ShouldHandleCustomEndpointPath_WhenSpecified()
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

    [Fact]
    public void MapScalarApiReference_ShouldThrowException_WhenDocumentNameNotSpecified()
    {
        // Arrange
        var tmpFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.Configure<ScalarOptions>(options => options.EndpointPathPrefix = "/custom-path");
            });
        });

        // Act
        var act = () => tmpFactory.CreateClient(); // CreateClient starts the app

        // Assert
        act.Should().Throw<ArgumentException>().WithMessage("'EndpointPathPrefix' must define '{documentName}'.");
    }
}
