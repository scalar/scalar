namespace Scalar.AspNetCore.Tests.Extensions;

public class AuthorizationCodeFlowExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flow = new AuthorizationCodeFlow();
        const string authorizationUrl = "https://example.com/auth";
        const string redirectUri = "https://example.com/callback";
        const string tokenUrl = "https://example.com/token";
        const string clientSecret = "test-client-secret";
        const Pkce pkce = Pkce.Sha256;
        const CredentialsLocation credentialsLocation = CredentialsLocation.Body;

        // Act
        flow
            .WithAuthorizationUrl(authorizationUrl)
            .WithRedirectUri(redirectUri)
            .WithTokenUrl(tokenUrl)
            .WithClientSecret(clientSecret)
            .WithPkce(pkce)
            .WithCredentialsLocation(credentialsLocation);

        // Assert
        flow.AuthorizationUrl.Should().Be(authorizationUrl);
        flow.RedirectUri.Should().Be(redirectUri);
        flow.TokenUrl.Should().Be(tokenUrl);
        flow.ClientSecret.Should().Be(clientSecret);
        flow.Pkce.Should().Be(pkce);
        flow.CredentialsLocation.Should().Be(credentialsLocation);
    }
}