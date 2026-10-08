using System.Text.Json;

namespace Scalar.Shared.Tests;

public class ShowExtensionsTests
{
    private static JsonElement SerializeConfiguration(ScalarOptions options) =>
        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

    [Fact]
    public void UnsetShowExtensions_OmitsConfigurationProperty()
    {
        SerializeConfiguration(new ScalarOptions()).TryGetProperty("showExtensions", out _).Should().BeFalse();
    }

    [Fact]
    public void WithShowExtensions_PreservesOrderAndSpelling()
    {
        var options = new ScalarOptions();

        var result = options.WithShowExtensions("x-Scopes", "x-internal");
        var json = SerializeConfiguration(options);

        result.Should().BeSameAs(options);
        json.GetProperty("showExtensions").EnumerateArray().Select(key => key.GetString())
            .Should().Equal("x-Scopes", "x-internal");
    }

    [Fact]
    public void WithShowExtensions_EmptyListClearsPreviousSelection()
    {
        var options = new ScalarOptions().WithShowExtensions("x-scopes").WithShowExtensions();

        SerializeConfiguration(options).GetProperty("showExtensions").GetArrayLength().Should().Be(0);
    }
}