using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class ScalarClientJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ScalarClient scalarClient = ScalarClient.Libcurl;

        // Act
        var json = JsonSerializer.Serialize(scalarClient);

        // Assert
        json.Should().Be("\"libcurl\"");
    }
}