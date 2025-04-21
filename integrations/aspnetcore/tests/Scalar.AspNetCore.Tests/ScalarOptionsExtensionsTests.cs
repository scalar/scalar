namespace Scalar.AspNetCore.Tests;

public class ScalarOptionsExtensionsTests
{
    [Fact]
    public void Extensions_ShouldSetAllPropertiesCorrectly()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
#pragma warning disable CS0618 // Type or member is obsolete
        options
            .WithTitle("My title")
            .WithEndpointPrefix("/docs/{documentName}")
            .WithModels(false)
            .WithDownloadButton(false)
            .WithTestRequestButton(false)
            .WithDarkMode(false)
            .WithSidebar(false)
            .WithTheme(ScalarTheme.Saturn)
            .WithLayout(ScalarLayout.Classic)
            .WithSearchHotKey("o")
            .WithProxyUrl("http://localhost:8080")
            .AddMetadata("key", "value")
            .WithPreferredScheme("my-scheme")
            .WithApiKeyAuthentication(x => x.Token = "my-api-token")
            .WithOAuth2Authentication(x =>
            {
                x.ClientId = "my-client";
                x.Scopes = ["scope"];
            })
            .WithHttpBasicAuthentication(x =>
            {
                x.Username = "my-username";
                x.Password = "my-password";
            })
            .WithHttpBearerAuthentication(x => x.Token = "my-bearer-token")
            .WithOpenApiRoutePattern("/swagger/{documentName}")
            .WithCdnUrl("http://localhost:8080")
            .WithDefaultFonts(false)
            .WithDefaultOpenAllTags(true)
            .WithCustomCss("*{}")
            .WithDarkModeToggle(false)
            .WithForceThemeMode(ThemeMode.Light)
            .WithTagSorter(TagSorter.Alpha)
            .WithOperationSorter(OperationSorter.Alpha)
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .AddServer("https://example.com")
            .AddServer(new ScalarServer("https://example.org", "My other server"))
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithFavicon("/favicon.png")
            .WithDotNetFlag(false)
            .WithClientButton(false)
            .AddHeadContent("<meta name=\"foo\" content=\"bar\"/>")
            .AddHeadContent("<meta name=\"bar\" content=\"foo\"/>")
            .AddHeaderContent("<h1>foo</h1>")
            .AddHeaderContent("<h2>bar</h2>")
            .AddDocument("v1", "Version 1")
            .AddDocuments("v2", "v3")
            .WithBaseServerUrl("https://example.com")
            .WithDynamicBaseServerUrl();

        // Assert
        options.Title.Should().Be("My title");
        options.EndpointPathPrefix.Should().Be("/docs/{documentName}");

        options.HideModels.Should().BeTrue();
        options.HideDownloadButton.Should().BeTrue();
        options.HideTestRequestButton.Should().BeTrue();
        options.DarkMode.Should().BeFalse();
        options.ShowSidebar.Should().BeFalse();
        options.Theme.Should().Be(ScalarTheme.Saturn);
        options.Layout.Should().Be(ScalarLayout.Classic);
        options.SearchHotKey.Should().Be("o");
        options.ProxyUrl.Should().Be("http://localhost:8080");
        options.Metadata.Should().ContainKey("key").And.ContainValue("value");
        options.Authentication!.PreferredSecurityScheme.Should().Be("my-scheme");
        options.Authentication!.ApiKey!.Token.Should().Be("my-api-token");
        options.Authentication!.OAuth2!.ClientId.Should().Be("my-client");
        options.Authentication!.OAuth2!.Scopes.Should().Contain("scope");
        options.Authentication!.Http!.Basic!.Username.Should().Contain("my-username");
        options.Authentication!.Http!.Basic!.Password.Should().Contain("my-password");
        options.Authentication!.Http!.Bearer!.Token.Should().Contain("my-bearer-token");
        options.OpenApiRoutePattern.Should().Be("/swagger/{documentName}");
        options.CdnUrl.Should().Be("http://localhost:8080");
        options.DefaultFonts.Should().BeFalse();
        options.DefaultOpenAllTags.Should().BeTrue();
        options.CustomCss.Should().Be("*{}");
        options.HideDarkModeToggle.Should().BeTrue();
        options.ForceThemeMode.Should().Be(ThemeMode.Light);
        options.DefaultHttpClient.Key.Should().Be(ScalarTarget.CSharp);
        options.DefaultHttpClient.Value.Should().Be(ScalarClient.HttpClient);
        options.Servers.Should().HaveCount(2);
        options.Servers.Should().ContainSingle(x => x.Url == "https://example.com");
        options.Servers.Should().ContainSingle(x => x.Url == "https://example.org" && x.Description == "My other server");
        options.TagSorter.Should().Be(TagSorter.Alpha);
        options.OperationSorter.Should().Be(OperationSorter.Alpha);
        options.DefaultHttpClient.Should().Be(new KeyValuePair<ScalarTarget, ScalarClient>(ScalarTarget.CSharp, ScalarClient.HttpClient));
        options.Favicon.Should().Be("/favicon.png");
        options.DotNetFlag.Should().BeFalse();
        options.HideClientButton.Should().BeTrue();
        options.HeadContent.Should().Be("<meta name=\"foo\" content=\"bar\"/><meta name=\"bar\" content=\"foo\"/>");
        options.HeaderContent.Should().Be("<h1>foo</h1><h2>bar</h2>");
        options.Documents.Should().HaveCount(3).And.Contain(x => x.Title == "Version 1");
        options.BaseServerUrl.Should().Be("https://example.com");
        options.DynamicBaseServerUrl.Should().BeTrue();

#pragma warning restore CS0618 // Type or member is obsolete
    }

    [Fact]
    public void AddDefaultScopes_ShouldAddScopesToScheme()
    {
        // Arrange
        var options = new ScalarOptions();
        string[] scopes = ["scope1", "scope2"];

        // Act
        options.AddDefaultScopes("oauth2Scheme", scopes);

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.DefaultScopes.Should().BeEquivalentTo(scopes);
    }

    [Fact]
    public void AddDefaultScopes_ShouldUpdateExistingScheme()
    {
        // Arrange
        var options = new ScalarOptions();
        string[] initialScopes = ["scope1"];
        string[] updatedScopes = ["scope2", "scope3"];
        options.AddDefaultScopes("oauth2Scheme", initialScopes);

        // Act
        options.AddDefaultScopes("oauth2Scheme", updatedScopes);

        // Assert
        var oauth2Scheme = options.Authentication!.SecuritySchemes!["oauth2Scheme"] as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.DefaultScopes.Should().BeEquivalentTo(updatedScopes);
    }

    [Fact]
    public void AddOAuth2Flows_ShouldConfigureFlows()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddOAuth2Flows("oauth2Scheme", flows =>
        {
            flows.AuthorizationCode = new AuthorizationCodeFlow
            {
                AuthorizationUrl = "https://auth.example.com/authorize",
                TokenUrl = "https://auth.example.com/token",
                ClientId = "clientId",
                ClientSecret = "clientSecret",
                RedirectUri = "https://auth.example.com/callback",
                SelectedScopes = ["foo"],
                Token = "token"
            };
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.Flows.Should().NotBeNull();
        oauth2Scheme.Flows!.AuthorizationCode.Should().NotBeNull();
        oauth2Scheme.Flows!.AuthorizationCode!.AuthorizationUrl.Should().Be("https://auth.example.com/authorize");
        oauth2Scheme.Flows!.AuthorizationCode!.TokenUrl.Should().Be("https://auth.example.com/token");
        oauth2Scheme.Flows!.AuthorizationCode!.ClientId.Should().Be("clientId");
        oauth2Scheme.Flows!.AuthorizationCode!.ClientSecret.Should().Be("clientSecret");
        oauth2Scheme.Flows!.AuthorizationCode!.RedirectUri.Should().Be("https://auth.example.com/callback");
        oauth2Scheme.Flows!.AuthorizationCode!.SelectedScopes.Should().Contain("foo");
        oauth2Scheme.Flows!.AuthorizationCode!.Token.Should().Be("token");
    }

    [Fact]
    public void AddClientCredentialsFlow_ShouldConfigureClientCredentialsFlow()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddClientCredentialsFlow("oauth2Scheme", flow =>
        {
            flow.TokenUrl = "https://auth.example.com/token";
            flow.RefreshUrl = "https://auth.example.com/refresh";
            flow.ClientId = "clientId";
            flow.ClientSecret = "clientSecret";
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.Flows.Should().NotBeNull();
        oauth2Scheme.Flows!.ClientCredentials.Should().NotBeNull();
        oauth2Scheme.Flows!.ClientCredentials!.TokenUrl.Should().Be("https://auth.example.com/token");
        oauth2Scheme.Flows!.ClientCredentials!.RefreshUrl.Should().Be("https://auth.example.com/refresh");
        oauth2Scheme.Flows!.ClientCredentials!.ClientId.Should().Be("clientId");
        oauth2Scheme.Flows!.ClientCredentials!.ClientSecret.Should().Be("clientSecret");
    }

    [Fact]
    public void AddAuthorizationCodeFlow_ShouldConfigureAuthorizationCodeFlow()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddAuthorizationCodeFlow("oauth2Scheme", flow =>
        {
            flow.AuthorizationUrl = "https://auth.example.com/authorize";
            flow.TokenUrl = "https://auth.example.com/token";
            flow.RefreshUrl = "https://auth.example.com/refresh";
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.Flows.Should().NotBeNull();
        oauth2Scheme.Flows!.AuthorizationCode.Should().NotBeNull();
        oauth2Scheme.Flows!.AuthorizationCode!.AuthorizationUrl.Should().Be("https://auth.example.com/authorize");
        oauth2Scheme.Flows!.AuthorizationCode!.TokenUrl.Should().Be("https://auth.example.com/token");
        oauth2Scheme.Flows!.AuthorizationCode!.RefreshUrl.Should().Be("https://auth.example.com/refresh");
    }

    [Fact]
    public void AddImplicitFlow_ShouldConfigureImplicitFlow()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddImplicitFlow("oauth2Scheme", flow =>
        {
            flow.AuthorizationUrl = "https://auth.example.com/authorize";
            flow.RefreshUrl = "https://auth.example.com/refresh";
            flow.RedirectUri = "https://auth.example.com/callback";
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.Flows.Should().NotBeNull();
        oauth2Scheme.Flows!.Implicit.Should().NotBeNull();
        oauth2Scheme.Flows!.Implicit!.AuthorizationUrl.Should().Be("https://auth.example.com/authorize");
        oauth2Scheme.Flows!.Implicit!.RefreshUrl.Should().Be("https://auth.example.com/refresh");
        oauth2Scheme.Flows!.Implicit!.RedirectUri.Should().Be("https://auth.example.com/callback");
    }

    [Fact]
    public void AddPasswordFlow_ShouldConfigurePasswordFlow()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddPasswordFlow("oauth2Scheme", flow =>
        {
            flow.TokenUrl = "https://auth.example.com/token";
            flow.RefreshUrl = "https://auth.example.com/refresh";
            flow.ClientId = "clientId";
            flow.ClientSecret = "clientSecret";
            flow.Username = "username";
            flow.Password = "password";
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.Flows.Should().NotBeNull();
        oauth2Scheme.Flows!.Password.Should().NotBeNull();
        oauth2Scheme.Flows!.Password!.TokenUrl.Should().Be("https://auth.example.com/token");
        oauth2Scheme.Flows!.Password!.RefreshUrl.Should().Be("https://auth.example.com/refresh");
        oauth2Scheme.Flows!.Password!.ClientId.Should().Be("clientId");
        oauth2Scheme.Flows!.Password!.ClientSecret.Should().Be("clientSecret");
        oauth2Scheme.Flows!.Password!.Username.Should().Be("username");
        oauth2Scheme.Flows!.Password!.Password.Should().Be("password");
    }

    [Fact]
    public void AddApiKeyAuthentication_ShouldConfigureApiKeyAuthentication()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddApiKeyAuthentication("apiKeyScheme", header =>
        {
            header.Name = "X-API-KEY";
            header.Value = "my-api-key";
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("apiKeyScheme");
        var scheme = options.Authentication!.SecuritySchemes["apiKeyScheme"];
        scheme.Should().BeOfType<ScalarApiKeySecurityScheme>();
        var apiKeyScheme = scheme as ScalarApiKeySecurityScheme;
        apiKeyScheme!.Name.Should().Be("X-API-KEY");
        apiKeyScheme.Value.Should().Be("my-api-key");
    }

    [Fact]
    public void AddHttpAuthentication_ShouldConfigureHttpAuthentication()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddHttpAuthentication("httpScheme", http =>
        {
            http.Username = "testuser";
            http.Password = "testpassword";
            http.Token = "testtoken";
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("httpScheme");
        var scheme = options.Authentication!.SecuritySchemes["httpScheme"];
        scheme.Should().BeOfType<ScalarHttpSecurityScheme>();
        var httpScheme = scheme as ScalarHttpSecurityScheme;
        httpScheme!.Username.Should().Be("testuser");
        httpScheme.Password.Should().Be("testpassword");
        httpScheme.Token.Should().Be("testtoken");
    }

    [Fact]
    public void AddHttpAuthentication_ShouldUpdateExistingHttpScheme()
    {
        // Arrange
        var options = new ScalarOptions();
        options.AddHttpAuthentication("httpScheme", http =>
        {
            http.Username = "olduser";
            http.Password = "oldpassword";
        });

        // Act
        options.AddHttpAuthentication("httpScheme", http =>
        {
            http.Username = "newuser";
            http.Password = "newpassword";
        });

        // Assert
        var httpScheme = options.Authentication!.SecuritySchemes!["httpScheme"] as ScalarHttpSecurityScheme;
        httpScheme!.Username.Should().Be("newuser");
        httpScheme.Password.Should().Be("newpassword");
    }

    [Fact]
    public void MultipleAuthMethods_ShouldAllWork()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options
            .AddApiKeyAuthentication("apiKey", config => config.Name = "X-API-KEY")
            .AddHttpAuthentication("basicAuth", config =>
            {
                config.Username = "testuser";
            })
            .AddClientCredentialsFlow("oauth2", config => config.TokenUrl = "https://example.com/token")
            .AddDefaultScopes("oauth2", "read", "write");

        // Assert
        options.Authentication!.SecuritySchemes.Should().ContainKeys("apiKey", "basicAuth", "oauth2");
        options.Authentication!.SecuritySchemes["apiKey"].Should().BeOfType<ScalarApiKeySecurityScheme>();
        options.Authentication!.SecuritySchemes["basicAuth"].Should().BeOfType<ScalarHttpSecurityScheme>();
        options.Authentication!.SecuritySchemes["oauth2"].Should().BeOfType<ScalarOAuth2SecurityScheme>();

        var oauth2Scheme = options.Authentication!.SecuritySchemes["oauth2"] as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.DefaultScopes.Should().BeEquivalentTo("read", "write");
        oauth2Scheme.Flows!.ClientCredentials!.TokenUrl.Should().Be("https://example.com/token");
    }

    [Fact]
    public void AddOAuth2Authentication_ShouldConfigureOAuth2Authentication()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options.AddOAuth2Authentication("oauth2Scheme", scheme =>
        {
            scheme.DefaultScopes = ["scope1", "scope2"];
            scheme.Flows = new ScalarFlows
            {
                AuthorizationCode = new AuthorizationCodeFlow
                {
                    AuthorizationUrl = "https://example.com/authorize"
                }
            };
        });

        // Assert
        options.Authentication.Should().NotBeNull();
        options.Authentication!.SecuritySchemes.Should().ContainKey("oauth2Scheme");
        var scheme = options.Authentication!.SecuritySchemes["oauth2Scheme"];
        scheme.Should().BeOfType<ScalarOAuth2SecurityScheme>();
        var oauth2Scheme = scheme as ScalarOAuth2SecurityScheme;
        oauth2Scheme!.DefaultScopes.Should().BeEquivalentTo("scope1", "scope2");
        oauth2Scheme.Flows!.AuthorizationCode!.AuthorizationUrl.Should().Be("https://example.com/authorize");
    }

    [Fact]
    public void AddOAuth2Authentication_ShouldUpdateExistingScheme()
    {
        // Arrange
        var options = new ScalarOptions();
        
        // Act
        options.AddOAuth2Flows("oauth2Scheme", flows =>
        {
            flows.AuthorizationCode = new AuthorizationCodeFlow
            {
                ClientId = "clientId",
            };
        });
        options.AddAuthorizationCodeFlow("oauth2Scheme", flow =>
        {
            flow.AuthorizationUrl = "https://example.com/authorize";
        });

        options.AddOAuth2Authentication("oauth2Scheme", scheme =>
        {
            scheme.DefaultScopes = ["scope1", "scope2"];
        });

        // Assert
        var oauth2Scheme = options.Authentication!.SecuritySchemes!["oauth2Scheme"] as ScalarOAuth2SecurityScheme;
        var authorizationCodeFlow = oauth2Scheme!.Flows!.AuthorizationCode;
        authorizationCodeFlow!.ClientId.Should().Be("clientId");
        authorizationCodeFlow.AuthorizationUrl.Should().Be("https://example.com/authorize");
        oauth2Scheme.DefaultScopes.Should().BeEquivalentTo("scope1", "scope2");
    }
}