using System.Text.Json;

namespace Scalar.Shared.Tests;

public class DocumentDownloadTypeJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const DocumentDownloadType downloadType = DocumentDownloadType.Json;

        // Act
        var json = JsonSerializer.Serialize(downloadType, typeof(DocumentDownloadType), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"json\"");
    }
}