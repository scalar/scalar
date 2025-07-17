namespace Scalar.AspNetCore.Tests.Extensions;

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
        const string tokenName = "id_token";


        // Act
        flow
            .WithRefreshUrl(refreshUrl)
            .WithSelectedScopes(selectedScopes)
            .WithToken(token)
            .WithTokenName(tokenName)
            .AddQueryParameter("custom_param", "value")
            .AddBodyParameter("custom_body_param", "body_value")
            .WithClientId(clientId);

        // Assert
        flow.RefreshUrl.Should().Be(refreshUrl);
        flow.SelectedScopes.Should().BeEquivalentTo(selectedScopes);
        flow.Token.Should().Be(token);
        flow.ClientId.Should().Be(clientId);
        flow.TokenName.Should().Be(tokenName);
        flow.AdditionalQueryParameters.Should().ContainKey("custom_param").WhoseValue.Should().Be("value");
        flow.AdditionalBodyParameters.Should().ContainKey("custom_body_param").WhoseValue.Should().Be("body_value");
    }
}

file sealed class OAuthTestFlow : OAuthFlow;