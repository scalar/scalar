using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class CredentialsLocationConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        var authorizationCodeFlow = new AuthorizationCodeFlow
        {
            CredentialsLocation = CredentialsLocation.Header
        };

        // Act
        var json = JsonSerializer.Serialize(authorizationCodeFlow);

        // Assert
        json.Should().Contain("\"header\"");
    }
}