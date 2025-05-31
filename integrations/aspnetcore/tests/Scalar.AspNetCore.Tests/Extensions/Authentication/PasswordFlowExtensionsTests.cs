namespace Scalar.AspNetCore.Tests.Extensions;

public class PasswordFlowExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flow = new PasswordFlow();
        const string tokenUrl = "https://example.com/token";
        const string clientSecret = "test-client-secret";
        const string username = "test-username";
        const string password = "test-password";

        // Act
        flow
            .WithTokenUrl(tokenUrl)
            .WithClientSecret(clientSecret)
            .WithUsername(username)
            .WithPassword(password);

        // Assert
        flow.TokenUrl.Should().Be(tokenUrl);
        flow.ClientSecret.Should().Be(clientSecret);
        flow.Username.Should().Be(username);
        flow.Password.Should().Be(password);
    }
}