using System.Text.Json;

namespace Scalar.Shared.Tests;

public class SidebarBadgesTests
{
    [Fact]
    public void UnsetOption_PreservesBrowserDefault()
    {
        var options = new ScalarOptions();
        var configuration = JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

        configuration.TryGetProperty("showBadgesInSidebar", out _).Should().BeFalse();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void WithBadgesInSidebar_SerializesExplicitValue(bool enabled)
    {
        var options = new ScalarOptions { ShowSidebar = false };
        var result = options.WithBadgesInSidebar(enabled);
        var configuration = JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

        result.Should().BeSameAs(options);
        configuration.GetProperty("showBadgesInSidebar").GetBoolean().Should().Be(enabled);
        configuration.GetProperty("showSidebar").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public void WithBadgesInSidebar_EnablesByDefault()
    {
        var options = new ScalarOptions().WithBadgesInSidebar();

        options.ToScalarConfiguration().ShowBadgesInSidebar.Should().BeTrue();
    }
}