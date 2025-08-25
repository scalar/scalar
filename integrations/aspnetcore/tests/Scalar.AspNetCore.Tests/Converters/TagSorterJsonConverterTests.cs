using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class TagSorterJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const TagSorter tagSorter = TagSorter.Alpha;

        // Act
        var json = JsonSerializer.Serialize(tagSorter);

        // Assert
        json.Should().Be("\"alpha\"");
    }
}