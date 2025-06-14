using System.Text.Json;

namespace Scalar.Aspire.Tests;

public class PkceConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        var authorizationCodeFlow = new AuthorizationCodeFlow
        {
            Pkce = Pkce.Sha256
        };

        // Act
        var json = JsonSerializer.Serialize(authorizationCodeFlow);

        // Assert
        json.Should().Contain("\"SHA-256\"");
    }
}