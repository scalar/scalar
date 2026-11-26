using System.Text.Json;

namespace Scalar.Shared.Tests;

public class HttpClientsTests
{
    private static JsonElement SerializeConfiguration(ScalarOptions options) =>
        JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);

    [Fact]
    public void WithHttpClients_PreservesIdsAndTargetWildcards()
    {
        var options = new ScalarOptions().WithHttpClients("node/fetch", "shell/*").WithDefaultHttpClient("node/fetch");

        var config = SerializeConfiguration(options);
        config.GetProperty("httpClients").EnumerateArray().Select(client => client.GetString()).Should().Equal("node/fetch", "shell/*");
        config.GetProperty("defaultHttpClient").GetString().Should().Be("node/fetch");
    }

    [Fact]
    public void WithHttpClients_DistinguishesOmittedAndEmptyLists()
    {
        var options = new ScalarOptions();
        SerializeConfiguration(options).TryGetProperty("httpClients", out _).Should().BeFalse();

        SerializeConfiguration(options.WithHttpClients()).GetProperty("httpClients").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void WithDefaultHttpClient_UsesTheLastFluentSelection()
    {
        var options = new ScalarOptions()
            .WithDefaultHttpClient(ScalarTarget.Shell, ScalarClient.Curl)
            .WithDefaultHttpClient("node/fetch");
        SerializeConfiguration(options).GetProperty("defaultHttpClient").GetString().Should().Be("node/fetch");

        options.WithDefaultHttpClient(ScalarTarget.Shell, ScalarClient.Curl);
        var defaultClient = SerializeConfiguration(options).GetProperty("defaultHttpClient");
        defaultClient.GetProperty("targetKey").GetString().Should().Be("shell");
        defaultClient.GetProperty("clientKey").GetString().Should().Be("curl");
    }

    [Fact]
    public void DefaultHttpClient_AssignmentOverridesStringSelection()
    {
        var options = new ScalarOptions().WithDefaultHttpClient("node/fetch");
        options.DefaultHttpClient = new(ScalarTarget.Shell, ScalarClient.Curl);

        var defaultClient = SerializeConfiguration(options).GetProperty("defaultHttpClient");
        defaultClient.GetProperty("targetKey").GetString().Should().Be("shell");
        defaultClient.GetProperty("clientKey").GetString().Should().Be("curl");
    }
}