using System.Text.Json;

namespace Scalar.Shared.Tests;

public class ScalarLayoutJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ScalarLayout scalarLayout = ScalarLayout.Modern;

        // Act
        var json = JsonSerializer.Serialize(scalarLayout, typeof(ScalarLayout), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"modern\"");
    }
}