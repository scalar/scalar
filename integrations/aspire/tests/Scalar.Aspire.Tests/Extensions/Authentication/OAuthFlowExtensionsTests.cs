namespace Scalar.Aspire.Tests.Extensions;

public class OAuthFlowGenericExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var flow = new OAuthTestFlow();
        const string refreshUrl = "https://example.com/refresh";
        string[] selectedScopes = ["foo", "bar"];

        const string token = "bear";
        const string clientId = "test-client-id";


        // Act
        flow
            .WithRefreshUrl(refreshUrl)
            .WithSelectedScopes(selectedScopes)
            .WithToken(token)
            .WithClientId(clientId);

        // Assert
        flow.RefreshUrl.Should().Be(refreshUrl);
        flow.SelectedScopes.Should().BeEquivalentTo(selectedScopes);
        flow.Token.Should().Be(token);
        flow.ClientId.Should().Be(clientId);
    }
}

file sealed class OAuthTestFlow : OAuthFlow;