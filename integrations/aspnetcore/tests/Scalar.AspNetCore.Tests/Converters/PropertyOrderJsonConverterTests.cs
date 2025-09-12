using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class PropertyOrderJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const PropertyOrder orderBy = PropertyOrder.Alpha;

        // Act
        var json = JsonSerializer.Serialize(orderBy);

        // Assert
        json.Should().Be("\"alpha\"");
    }
}