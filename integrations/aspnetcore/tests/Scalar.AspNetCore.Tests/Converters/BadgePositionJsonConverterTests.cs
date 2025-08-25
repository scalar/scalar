using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class BadgePositionJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const BadgePosition badgePosition = BadgePosition.After;

        // Act
        var json = JsonSerializer.Serialize(badgePosition);

        // Assert
        json.Should().Be("\"after\"");
    }
}