using Microsoft.AspNetCore.Routing;

namespace Scalar.AspNetCore.Tests;

public class ScalarEndpointRouteBuilderExtensionsTests
{
    [Fact]
    public void MapScalarApiReference_ShouldThrowException_WhenEndpointContainsDocumentName()
    {
        // Arrange
        var builder = Substitute.For<IEndpointRouteBuilder>();

        // Act
        var act = () => builder.MapScalarApiReference("/scalar/{documentName}");

        // Assert
        act.Should().Throw<ArgumentException>().WithMessage("The endpoint prefix cannot contain the '{documentName}' placeholder. (Parameter 'endpointPrefix')");
    }
}