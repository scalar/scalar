namespace Scalar.Aspire.Tests.Extensions;

public class ScalarApiKeySecuritySchemeExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var scheme = new ScalarApiKeySecurityScheme();
        const string name = "X-API-Key";
        const string value = "test-api-key-value";

        // Act
        scheme
            .WithName(name)
            .WithValue(value);

        // Assert
        scheme.Name.Should().Be(name);
        scheme.Value.Should().Be(value);
    }
}