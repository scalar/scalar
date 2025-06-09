namespace Scalar.Aspire.Tests.Extensions;

public class ScalarHttpSecuritySchemeExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var scheme = new ScalarHttpSecurityScheme();
        const string username = "test-username";
        const string password = "test-password";
        const string token = "test-token";

        // Act
        scheme
            .WithUsername(username)
            .WithPassword(password)
            .WithToken(token);

        // Assert
        scheme.Username.Should().Be(username);
        scheme.Password.Should().Be(password);
        scheme.Token.Should().Be(token);
    }
}