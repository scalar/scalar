using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class DocumentDownloadTypeJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const DocumentDownloadType downloadType = DocumentDownloadType.Json;

        // Act
        var json = JsonSerializer.Serialize(downloadType);

        // Assert
        json.Should().Be("\"json\"");
    }
}