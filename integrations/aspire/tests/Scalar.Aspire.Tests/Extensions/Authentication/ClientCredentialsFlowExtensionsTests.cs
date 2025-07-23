namespace Scalar.Aspire.Tests.Extensions;

public class ClientCredentialsFlowExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flow = new ClientCredentialsFlow();
        const string tokenUrl = "https://example.com/token";
        const string clientSecret = "test-client-secret";
        const CredentialsLocation credentialsLocation = CredentialsLocation.Body;

        // Act
        flow
            .WithTokenUrl(tokenUrl)
            .WithClientSecret(clientSecret)
            .WithCredentialsLocation(credentialsLocation);

        // Assert
        flow.TokenUrl.Should().Be(tokenUrl);
        flow.ClientSecret.Should().Be(clientSecret);
        flow.CredentialsLocation.Should().Be(credentialsLocation);
    }
}