using System.Text.Json;

namespace Scalar.Shared.Tests;

public class SelectedClientPersistenceTests
{
    private static JsonElement SerializeConfiguration(ScalarOptions options) =>
        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

    [Fact]
    public void UnsetPersistence_OmitsConfigurationProperty()
    {
        var options = new ScalarOptions();

        options.ToScalarConfiguration().PersistSelectedClient.Should().BeNull();
        SerializeConfiguration(options).TryGetProperty("persistSelectedClient", out _).Should().BeFalse();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void ExplicitPersistence_SerializesIndependentlyOfAuth(bool persistSelectedClient)
    {
        var options = new ScalarOptions
        {
            PersistSelectedClient = persistSelectedClient,
            PersistentAuthentication = true
        };

        var configuration = SerializeConfiguration(options);

        configuration.GetProperty("persistSelectedClient").GetBoolean().Should().Be(persistSelectedClient);
        configuration.GetProperty("persistAuth").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public void DisableSelectedClientPersistence_ReturnsOptionsAndSerializesFalse()
    {
        var options = new ScalarOptions();

        var result = options.DisableSelectedClientPersistence();

        result.Should().BeSameAs(options);
        SerializeConfiguration(options).GetProperty("persistSelectedClient").GetBoolean().Should().BeFalse();
    }
}