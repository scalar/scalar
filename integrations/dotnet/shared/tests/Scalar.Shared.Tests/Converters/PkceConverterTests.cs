using System.Text.Json;

namespace Scalar.Shared.Tests;

public class PkceConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const Pkce pkce = Pkce.Sha256;

        // Act
        var json = JsonSerializer.Serialize(pkce);

        // Assert
        json.Should().Be("\"SHA-256\"");
    }
}