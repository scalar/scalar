using Scalar.Azure.Functions;

namespace Scalar.Azure.Functions.Tests;

public class ScalarRequestProcessorTests
{
    [Fact]
    public void Process_ShouldReturnHtml_ForIndexRequest()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/", string.Empty, false, null);

        // Assert
        result.StatusCode.Should().Be(200);
        result.Html.Should().NotBeNull();
        result.Html.Should().Contain("<div id=\"app\"></div>");
        result.ContentType.Should().Be("text/html");
    }

    [Fact]
    public void Process_ShouldAddDefaultDocument_WhenNoneProvided()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/", string.Empty, false, null);

        // Assert
        result.Html.Should().Contain("openapi/v1.json");
    }

    [Fact]
    public void Process_ShouldUseDocumentNameFromRoute_WhenProvided()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/v3", "v3", false, null);

        // Assert
        result.Html.Should().Contain("openapi/v3.json");
        result.Html.Should().NotContain("v1");
    }

    [Fact]
    public void Process_ShouldRedirect_WhenIndexRequestedWithoutTrailingSlash()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar", string.Empty, false, null);

        // Assert
        result.StatusCode.Should().Be(302);
        result.RedirectLocation.Should().Be("scalar/");
    }

    [Fact]
    public void Process_ShouldServeStaticAsset_WhenKnownAssetRequested()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/scalar.azure.functions.js", "scalar.azure.functions.js", false, null);

        // Assert
        result.StatusCode.Should().Be(200);
        result.AssetStream.Should().NotBeNull();
        result.ContentType.Should().Be("text/javascript");
        result.ETag.Should().NotBeNullOrEmpty();
        result.AssetStream!.Dispose();
    }

    [Fact]
    public void Process_ShouldReturnNotModified_WhenETagMatches()
    {
        // Arrange
        var options = new ScalarOptions();
        var first = ScalarRequestProcessor.Process(options, "/api/scalar/favicon.svg", "favicon.svg", false, null);
        first.AssetStream!.Dispose();
        var etag = first.ETag;

        // Act
        var second = ScalarRequestProcessor.Process(options, "/api/scalar/favicon.svg", "favicon.svg", false, etag);

        // Assert
        second.NotModified.Should().BeTrue();
        second.StatusCode.Should().Be(304);
    }

    [Fact]
    public void Process_ShouldEmitNonce_WhenConfigured()
    {
        // Arrange
        var options = new ScalarOptions { Nonce = "test-nonce" };

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/", string.Empty, false, null);

        // Assert
        result.Nonce.Should().Be("test-nonce");
        result.CacheControl.Should().Be("no-store");
        result.Html.Should().Contain(" nonce=\"test-nonce\"");
    }
}
