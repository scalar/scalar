using System.Text.Json;

namespace Scalar.Shared.Tests;

public class OperationSorterJsonConverterTests
{
    [Fact]
    public void Converter_ShouldSerializeToStringFast()
    {
        // Arrange
        const OperationSorter operationSorter = OperationSorter.Alpha;

        // Act
        var json = JsonSerializer.Serialize(operationSorter, typeof(OperationSorter), ScalarConfigurationSerializerContext.Default);

        // Assert
        json.Should().Be("\"alpha\"");
    }
}