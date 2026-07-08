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
    public void Process_ShouldRenderClientPathWithoutDefaultAzureFunctionsRoutePrefix()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/", string.Empty, false, null);

        // Assert
        result.Html.Should().Contain("'%2Fscalar%2F'");
        result.Html.Should().NotContain("'%2Fapi%2Fscalar%2F'");
    }

    [Fact]
    public void Process_ShouldRenderClientPathWithCustomAzureFunctionsRoutePrefix()
    {
        // Arrange
        var options = new ScalarOptions { RoutePrefix = "functions" };

        // Act
        var result = ScalarRequestProcessor.Process(options, "/functions/scalar/", string.Empty, false, null);

        // Assert
        result.Html.Should().Contain("'%2Fscalar%2F'");
        result.Html.Should().NotContain("'%2Ffunctions%2Fscalar%2F'");
    }

    [Fact]
    public void Process_ShouldKeepFullClientPath_WhenAzureFunctionsRoutePrefixIsDisabled()
    {
        // Arrange
        var options = new ScalarOptions { RoutePrefix = null };

        // Act
        var result = ScalarRequestProcessor.Process(options, "/scalar/", string.Empty, false, null);

        // Assert
        result.Html.Should().Contain("'%2Fscalar%2F'");
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
    public void Process_ShouldServeStandaloneJavaScriptAsset()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/scalar.js", "scalar.js", false, null);

        // Assert
        result.StatusCode.Should().Be(200);
        result.AssetStream.Should().NotBeNull();
        result.ContentType.Should().Be("text/javascript");
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

    [Fact]
    public void Process_ShouldGenerateFreshNonce_WhenDynamicNonceEnabled()
    {
        // Arrange
        var options = new ScalarOptions { DynamicNonce = true };

        // Act
        var first = ScalarRequestProcessor.Process(options, "/api/scalar/", string.Empty, false, null);
        var second = ScalarRequestProcessor.Process(options, "/api/scalar/", string.Empty, false, null);

        // Assert
        first.Nonce.Should().NotBeNullOrEmpty();
        first.CacheControl.Should().Be("no-store");
        first.Html.Should().Contain($" nonce=\"{first.Nonce}\"");
        // A dynamic nonce must be unique per request so it cannot be replayed.
        second.Nonce.Should().NotBe(first.Nonce);
    }

    [Fact]
    public void Process_ShouldAdvertiseVaryAndCache_ForStaticAsset()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/scalar.js", "scalar.js", true, null);

        // Assert
        result.VaryAcceptEncoding.Should().BeTrue();
        result.CacheControl.Should().Be("no-cache");
        result.AssetStream!.Dispose();
    }

    [Fact]
    public void Process_ShouldReplaceDocumentNamePlaceholderInTitle_ForSingleDocument()
    {
        // Arrange
        var options = new ScalarOptions { Title = "{documentName} reference" };

        // Act
        var result = ScalarRequestProcessor.Process(options, "/api/scalar/v3", "v3", false, null);

        // Assert
        result.Html.Should().Contain("<title>v3 reference</title>");
    }

    [Fact]
    public void Process_ShouldStripRoutePrefix_WhenPathEqualsPrefixWithoutTrailingSlash()
    {
        // Arrange
        var options = new ScalarOptions { RoutePrefix = "scalar" };

        // Act: request path exactly equals the route prefix (no trailing slash, no remainder).
        var result = ScalarRequestProcessor.Process(options, "/scalar", string.Empty, false, null);

        // Assert: redirects to the trailing-slash form so relative asset URLs resolve.
        result.StatusCode.Should().Be(302);
        result.RedirectLocation.Should().Be("scalar/");
    }
}
