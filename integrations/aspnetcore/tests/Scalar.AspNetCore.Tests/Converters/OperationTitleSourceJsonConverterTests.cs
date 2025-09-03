using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class OperationTitleSourceJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const OperationTitleSource operationTitleSource = OperationTitleSource.Summary;

        // Act
        var json = JsonSerializer.Serialize(operationTitleSource);

        // Assert
        json.Should().Be("\"summary\"");
    }
}