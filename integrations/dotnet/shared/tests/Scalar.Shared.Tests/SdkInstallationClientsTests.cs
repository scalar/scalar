using System.Text.Json;

namespace Scalar.Shared.Tests;

public class SdkInstallationClientsTests
{
    [Fact]
    public void UnsetOption_OmitsConfigurationProperty()
    {
        var options = new ScalarOptions();
        var configuration = JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

        configuration.TryGetProperty("showDefaultClientsWithSdkInstallation", out _).Should().BeFalse();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void WithDefaultClientsWithSdkInstallation_SerializesExplicitValue(bool enabled)
    {
        var options = new ScalarOptions();
        var result = options.WithDefaultClientsWithSdkInstallation(enabled);
        var configuration = JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

        result.Should().BeSameAs(options);
        configuration.GetProperty("showDefaultClientsWithSdkInstallation").GetBoolean().Should().Be(enabled);
    }

    [Fact]
    public void WithDefaultClientsWithSdkInstallation_EnablesByDefault()
    {
        var options = new ScalarOptions().WithDefaultClientsWithSdkInstallation();

        options.ToScalarConfiguration().ShowDefaultClientsWithSdkInstallation.Should().BeTrue();
    }
}