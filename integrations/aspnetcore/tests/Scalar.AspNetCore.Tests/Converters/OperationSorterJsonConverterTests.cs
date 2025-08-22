using System.Text.Json;

namespace Scalar.AspNetCore.Tests;

public class OperationSorterJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const OperationSorter operationSorter = OperationSorter.Alpha;

        // Act
        var json = JsonSerializer.Serialize(operationSorter);

        // Assert
        json.Should().Be("\"alpha\"");
    }
}