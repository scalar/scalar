using System.Text.Json;

namespace Scalar.Shared.Tests;

public class PropertyOrderJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const PropertyOrder orderBy = PropertyOrder.Alpha;

        // Act
        var json = JsonSerializer.Serialize(orderBy, typeof(PropertyOrder), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"alpha\"");
    }
}