namespace Scalar.Aspire.Tests.Extensions;

public class ImplicitFlowExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flow = new ImplicitFlow();
        const string authorizationUrl = "https://example.com/auth";
        const string redirectUri = "https://example.com/callback";

        // Act
        flow
            .WithAuthorizationUrl(authorizationUrl)
            .WithRedirectUri(redirectUri);

        // Assert
        flow.AuthorizationUrl.Should().Be(authorizationUrl);
        flow.RedirectUri.Should().Be(redirectUri);
    }
}