using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class ScalarTargetJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ScalarTarget scalarTarget = ScalarTarget.CSharp;

        // Act
        var json = JsonSerializer.Serialize(scalarTarget);

        // Assert
        json.Should().Be("\"csharp\"");
    }
}