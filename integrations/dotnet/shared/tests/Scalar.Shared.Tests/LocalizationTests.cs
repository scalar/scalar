using System.Text.Json;
using System.Text.Json.Nodes;

namespace Scalar.Shared.Tests;

public class LocalizationTests
{
    private static JsonElement SerializeConfiguration(ScalarOptions options) =>
        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

    [Fact]
    public void UnsetLocalization_OmitsConfigurationProperty()
    {
        SerializeConfiguration(new ScalarOptions()).TryGetProperty("localization", out _).Should().BeFalse();
    }

    [Fact]
    public void WithLocalization_PreservesLocaleAndNestedOverrides()
    {
        var options = new ScalarOptions();
        var localization = new ScalarLocalizationOptions
        {
            Locale = "de-DE",
            Translations = new JsonObject
            {
                ["operation"] = new JsonObject { ["testRequest"] = "Anfrage ausprobieren" },
                ["apiClient"] = new JsonObject { ["addressBar"] = new JsonObject { ["send"] = "Senden" } }
            }
        };

        var result = options.WithLocalization(localization);
        var json = SerializeConfiguration(options).GetProperty("localization");

        result.Should().BeSameAs(options);
        json.GetProperty("locale").GetString().Should().Be("de-DE");
        json.TryGetProperty("direction", out _).Should().BeFalse();
        json.GetProperty("translations").GetProperty("operation").GetProperty("testRequest").GetString().Should().Be("Anfrage ausprobieren");
        json.GetProperty("translations").GetProperty("apiClient").GetProperty("addressBar").GetProperty("send").GetString().Should().Be("Senden");
    }

    [Theory]
    [InlineData(TextDirection.Auto, "auto")]
    [InlineData(TextDirection.LeftToRight, "ltr")]
    [InlineData(TextDirection.RightToLeft, "rtl")]
    public void Direction_SerializesBrowserValues(TextDirection direction, string expected)
    {
        var options = new ScalarOptions { Localization = new ScalarLocalizationOptions { Direction = direction } };

        var json = SerializeConfiguration(options).GetProperty("localization");

        json.GetProperty("direction").GetString().Should().Be(expected);
        json.TryGetProperty("locale", out _).Should().BeFalse();
        json.TryGetProperty("translations", out _).Should().BeFalse();
    }
}
