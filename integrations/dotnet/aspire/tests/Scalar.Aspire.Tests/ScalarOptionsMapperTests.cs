using System.Runtime.CompilerServices;

namespace Scalar.Aspire.Tests;

public class ScalarOptionsMapperTests
{
    private static IEnumerable<ScalarConfiguration> GetConfigurations(IEnumerable<ScalarTestOptions> options)
    {
        var finalOptions = options.AsAsyncEnumerable(TestContext.Current.CancellationToken);
        var configurations = finalOptions.ToScalarConfigurationsAsync(TestContext.Current.CancellationToken).ToBlockingEnumerable(TestContext.Current.CancellationToken);
        return configurations;
    }

    [Fact]
    public void ToScalarConfigurations_ShouldReturnCorrectConfiguration()
    {
        // Arrange
        ScalarTestOptions[] options = [new(), new()];

        // Act
        var configurations = GetConfigurations(options);

        // Assert
        configurations.Should().HaveCount(2);
    }

    [Fact]
    public void ToScalarConfigurations_ShouldMapMcpConfiguration()
    {
        // Arrange
        var options = new ScalarTestOptions
        {
            Mcp = new ScalarMcpOptions
            {
                Name = "My MCP",
                Url = "https://mcp.example.com",
                Disabled = true
            }
        };

        // Act
        var configurations = GetConfigurations([options]).ToArray();

        // Assert
        configurations.Should().ContainSingle();
        configurations[0].Mcp.Should().NotBeNull();
        configurations[0].Mcp!.Name.Should().Be("My MCP");
        configurations[0].Mcp!.Url.Should().Be("https://mcp.example.com");
        configurations[0].Mcp!.Disabled.Should().BeTrue();
    }
}

file static class ScalarTestOptionsExtensions
{
#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    public static async IAsyncEnumerable<T> AsAsyncEnumerable<T>(this IEnumerable<T> enumerable, [EnumeratorCancellation] CancellationToken cancellationToken)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
    {
        foreach (var value in enumerable)
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return value;
        }
    }
}