namespace Scalar.Aspire.Tests.Extensions;

public class ScalarFlowsExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flows = new ScalarFlows();

        // Act
        flows
            .WithImplicit(flow =>
            {
                flow.WithAuthorizationUrl("https://example.com/auth");
                flow.WithRedirectUri("https://example.com/callback");
            })
            .WithPassword(flow =>
            {
                flow.WithTokenUrl("https://example.com/token");
                flow.WithUsername("test-user");
                flow.WithPassword("test-pass");
            })
            .WithClientCredentials(flow =>
            {
                flow.WithTokenUrl("https://example.com/token");
                flow.WithClientSecret("client-secret");
            })
            .WithAuthorizationCode(flow =>
            {
                flow.WithAuthorizationUrl("https://example.com/auth");
                flow.WithTokenUrl("https://example.com/token");
                flow.WithRedirectUri("https://example.com/callback");
                flow.WithClientSecret("client-secret");
                flow.WithPkce(Pkce.Sha256);
            });

        // Assert
        flows.Implicit.Should().NotBeNull();
        flows.Implicit!.AuthorizationUrl.Should().Be("https://example.com/auth");
        flows.Implicit!.RedirectUri.Should().Be("https://example.com/callback");

        flows.Password.Should().NotBeNull();
        flows.Password!.TokenUrl.Should().Be("https://example.com/token");
        flows.Password!.Username.Should().Be("test-user");
        flows.Password!.Password.Should().Be("test-pass");

        flows.ClientCredentials.Should().NotBeNull();
        flows.ClientCredentials!.TokenUrl.Should().Be("https://example.com/token");
        flows.ClientCredentials!.ClientSecret.Should().Be("client-secret");

        flows.AuthorizationCode.Should().NotBeNull();
        flows.AuthorizationCode!.AuthorizationUrl.Should().Be("https://example.com/auth");
        flows.AuthorizationCode!.TokenUrl.Should().Be("https://example.com/token");
        flows.AuthorizationCode!.RedirectUri.Should().Be("https://example.com/callback");
        flows.AuthorizationCode!.ClientSecret.Should().Be("client-secret");
        flows.AuthorizationCode!.Pkce.Should().Be(Pkce.Sha256);
    }
}