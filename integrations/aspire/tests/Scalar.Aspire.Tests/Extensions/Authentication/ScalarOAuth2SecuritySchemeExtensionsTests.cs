namespace Scalar.Aspire.Tests.Extensions;

public class ScalarOAuth2SecuritySchemeExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var scheme = new ScalarOAuth2SecurityScheme();
        string[] defaultScopes = ["read", "write", "admin"];

        // Act
        scheme
            .WithFlows(flows =>
            {
                flows.WithAuthorizationCode(flow =>
                {
                    flow.WithAuthorizationUrl("https://example.com/auth");
                });
            })
            .WithDefaultScopes(defaultScopes);

        // Assert
        scheme.Flows.Should().NotBeNull();
        scheme.Flows!.AuthorizationCode.Should().NotBeNull();
        scheme.Flows!.AuthorizationCode!.AuthorizationUrl.Should().Be("https://example.com/auth");
        scheme.DefaultScopes.Should().BeEquivalentTo(defaultScopes);
    }
}