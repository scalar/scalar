using System.Text.Json;

namespace Scalar.Shared.Tests;

public class FeaturedClientsTests
{
    private static JsonElement SerializeConfiguration(ScalarOptions options) =>
        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

    [Fact]
    public void UnsetFeaturedClients_OmitsConfigurationProperty()
    {
        var options = new ScalarOptions();

        options.ToScalarConfiguration().FeaturedClients.Should().BeNull();
        SerializeConfiguration(options).TryGetProperty("featuredClients", out _).Should().BeFalse();
    }

    [Fact]
    public void WithFeaturedClients_PreservesOrderAndSerializesClientIds()
    {
        var options = new ScalarOptions();

        var result = options.WithFeaturedClients(
            new(ScalarTarget.Java, ScalarClient.NetHttp),
            new(ScalarTarget.CSharp, ScalarClient.HttpClient),
            new(ScalarTarget.Shell, ScalarClient.Curl));

        result.Should().BeSameAs(options);
        options.FeaturedClients.Should().HaveCount(3);
        SerializeConfiguration(options).GetProperty("featuredClients").EnumerateArray()
            .Select(client => client.GetString()).Should().Equal("java/nethttp", "csharp/httpclient", "shell/curl");
    }

    [Fact]
    public void WithFeaturedClients_EmptyArraySerializesWithoutFallingBackToDefaults()
    {
        var options = new ScalarOptions().WithFeaturedClients();

        options.ToScalarConfiguration().FeaturedClients.Should().BeEmpty();
        SerializeConfiguration(options).GetProperty("featuredClients").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void FeaturedClients_DoesNotChangeAvailabilityOrDefaultSelection()
    {
        var options = new ScalarOptions
        {
            EnabledTargets = [ScalarTarget.Shell],
            DefaultHttpClient = new(ScalarTarget.Shell, ScalarClient.Curl),
            FeaturedClients = [new(ScalarTarget.Java, ScalarClient.NetHttp)]
        };

        var configuration = options.ToScalarConfiguration();

        configuration.FeaturedClients.Should().Equal("java/nethttp");
        ((Dictionary<ScalarTarget, ScalarClient[]>) configuration.HiddenClients!).Should()
            .ContainKey(ScalarTarget.Java).WhoseValue.Should().Contain(ScalarClient.NetHttp);
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.Shell);
        configuration.DefaultHttpClient.ClientKey.Should().Be(ScalarClient.Curl);
    }
}