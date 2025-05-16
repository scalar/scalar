using Microsoft.AspNetCore.Http;

namespace Scalar.AspNetCore.Tests;

public class HttpRequestExtensionsTests
{
    [Theory]
    [InlineData("gzip, br", true)]
    [InlineData("deflate, gZIP", true)]
    [InlineData("br", false)]
    public void IsGzipAccepted_ShouldReturnTrue_WhenGzipIsPresent(string acceptEncoding, bool expected)
    {
        // Arrange
        var httpRequest = new DefaultHttpContext().Request;
        httpRequest.Headers.AcceptEncoding = acceptEncoding;

        // Act
        var result = httpRequest.IsGzipAccepted();

        // Assert
        result.Should().Be(expected);
    }
}