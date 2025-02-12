namespace Scalar.AspNetCore.Tests;

public class ScalarOptionsTests
{
    [Theory]
    [InlineData("https://some.url/openapi.json")]
    [InlineData("http://some.url/openapi.json")]
    public void IsOpenApiRoutePatternUrl_ShouldReturnTrueForAbsoluteUrls(string openApiRoute)
    {
        // Arrange
        var options = new ScalarOptions
        {
            OpenApiRoutePattern = openApiRoute,
        };

        // Act
        var result = options.IsOpenApiRoutePatternUrl;

        // Assert
        result.Should().BeTrue();
    }
    
    [Theory]
    [InlineData("relative/path/openapi.json")]
    [InlineData("/absolute/path/openapi.json")]
    [InlineData("//doubleslash//path/openapi.json")]
    [InlineData("/placeholder/path/{documentName}.json")]
    public void IsOpenApiRoutePatternUrl_ShouldReturnTrueForPathOnly(string openApiRoute)
    {
        // Arrange
        var options = new ScalarOptions
        {
            OpenApiRoutePattern = openApiRoute,
        };

        // Act
        var result = options.IsOpenApiRoutePatternUrl;

        // Assert
        result.Should().BeFalse();
    }
}