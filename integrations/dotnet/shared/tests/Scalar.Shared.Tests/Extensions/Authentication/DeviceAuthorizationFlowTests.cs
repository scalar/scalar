using System.Text.Json;

namespace Scalar.Shared.Tests.Extensions;

public class DeviceAuthorizationFlowTests
{
    [Fact]
    public void SerializesDeviceAuthorizationConfiguration()
    {
        var options = new ScalarOptions();
        var result = options.AddDeviceAuthorizationFlow("deviceOAuth", flow => flow
            .WithDeviceAuthorizationUrl("https://auth.example.com/device")
            .WithTokenUrl("https://auth.example.com/token")
            .WithClientSecret("example-secret")
            .WithCredentialsLocation(CredentialsLocation.Header)
            .WithClientId("example-client")
            .WithRefreshUrl("https://auth.example.com/refresh")
            .WithSelectedScopes("read", "write")
            .WithToken("example-token")
            .AddQueryParameter("audience", "example-api")
            .AddBodyParameter("resource", "example-resource")
            .WithTokenName("custom_token"));

        result.Should().BeSameAs(options);
        var json = JsonSerializer.Serialize(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);
        using var document = JsonDocument.Parse(json);
        var scheme = document.RootElement.GetProperty("authentication").GetProperty("securitySchemes").GetProperty("deviceOAuth");
        var flows = scheme.GetProperty("flows");
        flows.EnumerateObject().Select(property => property.Name).Should().Equal("deviceAuthorization");
        var flow = flows.GetProperty("deviceAuthorization");
        flow.GetProperty("deviceAuthorizationUrl").GetString().Should().Be("https://auth.example.com/device");
        flow.GetProperty("tokenUrl").GetString().Should().Be("https://auth.example.com/token");
        flow.GetProperty("clientSecret").GetString().Should().Be("example-secret");
        flow.GetProperty("x-scalar-credentials-location").GetString().Should().Be("header");
        flow.GetProperty("x-scalar-client-id").GetString().Should().Be("example-client");
        flow.GetProperty("refreshUrl").GetString().Should().Be("https://auth.example.com/refresh");
        flow.GetProperty("selectedScopes").EnumerateArray().Select(value => value.GetString()).Should().Equal("read", "write");
        flow.GetProperty("token").GetString().Should().Be("example-token");
        flow.GetProperty("x-scalar-security-query").GetProperty("audience").GetString().Should().Be("example-api");
        flow.GetProperty("x-scalar-security-body").GetProperty("resource").GetString().Should().Be("example-resource");
        flow.GetProperty("x-tokenName").GetString().Should().Be("custom_token");
    }

    [Fact]
    public void ReusesExistingFlowAndPreservesOtherFlows()
    {
        var options = new ScalarOptions();
        options.AddClientCredentialsFlow("deviceOAuth", flow => flow.WithTokenUrl("https://auth.example.com/client-token"));
        options.AddDeviceAuthorizationFlow("deviceOAuth", flow => flow.WithDeviceAuthorizationUrl("https://auth.example.com/device"));
        var scheme = (ScalarOAuth2SecurityScheme)options.Authentication!.SecuritySchemes!["deviceOAuth"];
        var originalFlow = scheme.Flows!.DeviceAuthorization;

        options.AddDeviceAuthorizationFlow("deviceOAuth", flow => flow.WithTokenUrl("https://auth.example.com/token"));

        scheme.Flows.DeviceAuthorization.Should().BeSameAs(originalFlow);
        scheme.Flows.DeviceAuthorization!.DeviceAuthorizationUrl.Should().Be("https://auth.example.com/device");
        scheme.Flows.DeviceAuthorization.TokenUrl.Should().Be("https://auth.example.com/token");
        scheme.Flows.ClientCredentials!.TokenUrl.Should().Be("https://auth.example.com/client-token");
    }

    [Fact]
    public void SupportsDirectFlowConfigurationAndClearingOptionalValues()
    {
        var flow = new DeviceAuthorizationFlow
        {
            DeviceAuthorizationUrl = "https://auth.example.com/device",
            TokenUrl = "https://auth.example.com/token",
            ClientSecret = "example-secret",
            CredentialsLocation = CredentialsLocation.Body
        };
        var flows = new ScalarFlows { DeviceAuthorization = flow };

        var result = flows.WithDeviceAuthorization(configure => configure
            .WithDeviceAuthorizationUrl(null)
            .WithTokenUrl(null)
            .WithClientSecret(null)
            .WithCredentialsLocation(null));

        result.Should().BeSameAs(flows);
        flows.DeviceAuthorization.Should().BeSameAs(flow);
        flow.DeviceAuthorizationUrl.Should().BeNull();
        flow.TokenUrl.Should().BeNull();
        flow.ClientSecret.Should().BeNull();
        flow.CredentialsLocation.Should().BeNull();
    }

    [Fact]
    public void OmitsUnconfiguredDeviceAuthorization()
    {
        var options = new ScalarOptions();
        options.AddClientCredentialsFlow("oauth", flow => flow.WithTokenUrl("https://auth.example.com/token"));

        var json = JsonSerializer.Serialize(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);
        using var document = JsonDocument.Parse(json);
        var flows = document.RootElement.GetProperty("authentication").GetProperty("securitySchemes").GetProperty("oauth").GetProperty("flows");

        flows.TryGetProperty("deviceAuthorization", out _).Should().BeFalse();
    }
}
