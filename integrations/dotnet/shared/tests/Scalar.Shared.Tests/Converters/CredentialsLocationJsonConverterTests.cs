using System.Text.Json;

namespace Scalar.Shared.Tests;

public class CredentialsLocationJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const CredentialsLocation credentialsLocation = CredentialsLocation.Header;

        // Act
        var json = JsonSerializer.Serialize(credentialsLocation, typeof(CredentialsLocation), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"header\"");
    }
}