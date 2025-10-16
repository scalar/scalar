using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class StabilityJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const Stability stability = Stability.Stable;

        // Act
        var json = JsonSerializer.Serialize(stability);

        // Assert
        json.Should().Be("\"stable\"");
    }
}