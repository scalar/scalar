using System.Text.Json;

namespace Scalar.Shared.Tests;

public class SchemaDisplayTests
{
    private static JsonElement SerializeConfiguration(ScalarOptions options) =>
        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

    [Fact]
    public void UnsetOptions_PreserveBrowserDefaults()
    {
        var json = SerializeConfiguration(new ScalarOptions());

        foreach (var key in new[] { "hideModelNames", "maxVisibleRequestBodyProperties", "expandAllParameters", "expandAllSchemaProperties" })
        {
            json.TryGetProperty(key, out _).Should().BeFalse();
        }
    }

    [Theory]
    [InlineData(true, 0)]
    [InlineData(false, 3)]
    [InlineData(false, -1)]
    public void FluentOptions_SerializeExplicitValues(bool enabled, int limit)
    {
        var options = new ScalarOptions();

        var result = options.WithHideModelNames(enabled)
            .WithMaxVisibleRequestBodyProperties(limit)
            .WithExpandAllParameters(enabled)
            .WithExpandAllSchemaProperties(enabled);
        var json = SerializeConfiguration(options);

        result.Should().BeSameAs(options);
        json.GetProperty("hideModelNames").GetBoolean().Should().Be(enabled);
        json.GetProperty("maxVisibleRequestBodyProperties").GetInt32().Should().Be(limit);
        json.GetProperty("expandAllParameters").GetBoolean().Should().Be(enabled);
        json.GetProperty("expandAllSchemaProperties").GetBoolean().Should().Be(enabled);
    }
}