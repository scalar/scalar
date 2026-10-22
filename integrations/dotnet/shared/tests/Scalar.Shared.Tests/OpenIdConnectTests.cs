using System.Text.Json;

namespace Scalar.Shared.Tests;

public class OpenIdConnectTests
{
    [Fact]
    public void SecuritySchemes_SerializesOpenIdConnectDefaults()
    {
        var options = new ScalarOptions
        {
            Authentication = new ScalarAuthenticationOptions
            {
                SecuritySchemes = new Dictionary<string, ScalarSecurityScheme>
                {
                    ["OpenIdConnect"] = new ScalarOpenIdConnectSecurityScheme
                    {
                        Flows = new ScalarFlows
                        {
                            AuthorizationCode = new AuthorizationCodeFlow
                            {
                                Pkce = Pkce.Sha256,
                                ClientId = "scalar",
                                SelectedScopes = ["openid", "profile", "email"]
                            }
                        },
                        DefaultScopes = ["openid"]
                    }
                }
            }
        };

        var json = JsonSerializer.SerializeToElement(options.ToScalarConfiguration(), ScalarConfigurationSerializerContext.Default.ScalarConfiguration);
        var scheme = json.GetProperty("authentication").GetProperty("securitySchemes").GetProperty("OpenIdConnect");
        var flow = scheme.GetProperty("flows").GetProperty("authorizationCode");
        flow.GetProperty("x-scalar-client-id").GetString().Should().Be("scalar");
        flow.GetProperty("x-usePkce").GetString().Should().Be("SHA-256");
        flow.GetProperty("selectedScopes").EnumerateArray().Select(scope => scope.GetString()).Should().Equal("openid", "profile", "email");
        scheme.GetProperty("x-default-scopes").EnumerateArray().Select(scope => scope.GetString()).Should().Equal("openid");
        flow.TryGetProperty("authorizationUrl", out _).Should().BeFalse();
    }

    [Fact]
    public void AddOpenIdConnectAuthentication_ReusesExistingScheme()
    {
        var options = new ScalarOptions();
        options.AddOpenIdConnectAuthentication("oidc", scheme => scheme.Description = "Sign in");
        var original = options.Authentication!.SecuritySchemes!["oidc"];

        var result = options.AddOpenIdConnectAuthentication("oidc", scheme => scheme.DefaultScopes = ["openid"]);

        result.Should().BeSameAs(options);
        options.Authentication.SecuritySchemes["oidc"].Should().BeSameAs(original);
        var oidc = (ScalarOpenIdConnectSecurityScheme) original;
        oidc.Description.Should().Be("Sign in");
        oidc.DefaultScopes.Should().Equal("openid");
    }
}