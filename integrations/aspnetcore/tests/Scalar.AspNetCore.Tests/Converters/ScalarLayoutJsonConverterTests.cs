using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class ScalarLayoutJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ScalarLayout scalarLayout = ScalarLayout.Modern;

        // Act
        var json = JsonSerializer.Serialize(scalarLayout);

        // Assert
        json.Should().Be("\"modern\"");
    }
}