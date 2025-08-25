using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class ThemeModeJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ThemeMode themeMode = ThemeMode.Light;

        // Act
        var json = JsonSerializer.Serialize(themeMode);

        // Assert
        json.Should().Be("\"light\"");
    }
}