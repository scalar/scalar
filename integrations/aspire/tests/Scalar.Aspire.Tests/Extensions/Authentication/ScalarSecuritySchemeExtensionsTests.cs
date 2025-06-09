namespace Scalar.Aspire.Tests.Extensions;

public class ScalarSecuritySchemeExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var scheme = new ScalarHttpSecurityScheme();
        const string description = "Test security scheme description";

        // Act
        scheme.WithDescription(description);

        // Assert
        scheme.Description.Should().Be(description);
    }

    [Fact]
    public void WithDescription_ShouldReturnCorrectType()
    {
        // Arrange
        var httpScheme = new ScalarHttpSecurityScheme();
        var apiKeyScheme = new ScalarApiKeySecurityScheme();
        var oauth2Scheme = new ScalarOAuth2SecurityScheme();

        // Act & Assert
        httpScheme.WithDescription("test").Should().BeOfType<ScalarHttpSecurityScheme>();
        apiKeyScheme.WithDescription("test").Should().BeOfType<ScalarApiKeySecurityScheme>();
        oauth2Scheme.WithDescription("test").Should().BeOfType<ScalarOAuth2SecurityScheme>();
    }
}