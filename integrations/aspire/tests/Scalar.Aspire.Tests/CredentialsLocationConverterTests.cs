using System.Text.Json;

namespace Scalar.Aspire.Tests;

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