using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class ScalarThemeJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ScalarTheme scalarTheme = ScalarTheme.Default;

        // Act
        var json = JsonSerializer.Serialize(scalarTheme);

        // Assert
        json.Should().Be("\"default\"");
    }
}