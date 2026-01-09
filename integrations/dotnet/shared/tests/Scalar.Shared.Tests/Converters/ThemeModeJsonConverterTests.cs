using System.Text.Json;

namespace Scalar.Shared.Tests;

public class ThemeModeJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const ThemeMode themeMode = ThemeMode.Light;

        // Act
        var json = JsonSerializer.Serialize(themeMode, typeof(ThemeMode), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"light\"");
    }
}