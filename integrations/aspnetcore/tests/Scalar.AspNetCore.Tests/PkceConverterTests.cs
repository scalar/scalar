using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

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
        var json = JsonSerializer.Serialize(authorizationCodeFlow, typeof(AuthorizationCodeFlow), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Contain("\"SHA-256\"");
    }
}