using System.Text.Json;

namespace Scalar.Shared.Tests;

public class OperationTitleSourceJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const OperationTitleSource operationTitleSource = OperationTitleSource.Summary;

        // Act
        var json = JsonSerializer.Serialize(operationTitleSource, typeof(OperationTitleSource), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"summary\"");
    }
}