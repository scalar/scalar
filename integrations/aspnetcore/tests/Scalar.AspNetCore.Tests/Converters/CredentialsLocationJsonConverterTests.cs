using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class CredentialsLocationJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const CredentialsLocation credentialsLocation = CredentialsLocation.Header;

        // Act
        var json = JsonSerializer.Serialize(credentialsLocation);

        // Assert
        json.Should().Be("\"header\"");
    }
}