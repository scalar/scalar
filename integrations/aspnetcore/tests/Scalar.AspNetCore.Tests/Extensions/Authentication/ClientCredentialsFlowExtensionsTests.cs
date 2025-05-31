namespace Scalar.AspNetCore.Tests.Extensions;

public class ClientCredentialsFlowExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flow = new ClientCredentialsFlow();
        const string tokenUrl = "https://example.com/token";
        const string clientSecret = "test-client-secret";

        // Act
        flow
            .WithTokenUrl(tokenUrl)
            .WithClientSecret(clientSecret);

        // Assert
        flow.TokenUrl.Should().Be(tokenUrl);
        flow.ClientSecret.Should().Be(clientSecret);
    }
}