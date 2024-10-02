namespace Scalar.AspNetCore.Tests;

public class ScalarOptionsExtensionsTests
{
    [Fact]
    public void Do()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        options
            .WithModels(false)
            .WithDownloadButton(false)
            .WithTestRequestButton(false)
            .WithDarkMode(false)
            .WithSidebar(false)
            .WithTheme(ScalarTheme.Saturn)
            .WithSearchHotKey("o")
            .WithProxyUrl("http://localhost:8080")
            .AddMetadata("key", "value")
            .WithPreferredScheme("my-scheme")
            .WithApiKeyAuthentication(x => x.Token = "my-token")
            .WithOAuth2Authentication(x =>
            {
                x.ClientId = "my-client";
                x.Scopes = ["scope"];
            })
            .WithOpenApiRoutePattern("/swagger/{documentName}")
            .WithCdnUrl("http://localhost:8080")
            .WithDefaultFonts(false)
            .WithDefaultOpenAllTags(true)
            .WithCustomCss("*{}")
            .WithDarkModeToggle(false)
            .WithForceThemeMode(ThemeMode.Light)
            .WithTagSorter(TagSorter.Alpha)
            .AddServer("https://example.com")
            .AddServer(new ScalarServer("https://example.org", "My other server"))
            .WithEndpointPrefix("my-prefix")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithTitle("My title")
            .WithFavicon("/favicon.png");

        // Assert
        options.HideModels.Should().BeTrue();
        options.HideDownloadButton.Should().BeTrue();
        options.HideTestRequestButton.Should().BeTrue();
        options.DarkMode.Should().BeFalse();
        options.ShowSidebar.Should().BeFalse();
        options.Theme.Should().Be(ScalarTheme.Saturn);
        options.SearchHotKey.Should().Be("o");
        options.ProxyUrl.Should().Be("http://localhost:8080");
        options.Metadata.Should().ContainKey("key").And.ContainValue("value");
        options.Authentication!.PreferredSecurityScheme.Should().Be("my-scheme");
        options.Authentication!.ApiKey!.Token.Should().Be("my-token");
        options.Authentication!.OAuth2!.ClientId.Should().Be("my-client");
        options.Authentication!.OAuth2!.Scopes.Should().Contain("scope");
        options.OpenApiRoutePattern.Should().Be("/swagger/{documentName}");
        options.CdnUrl.Should().Be("http://localhost:8080");
        options.DefaultFonts.Should().BeFalse();
        options.DefaultOpenAllTags.Should().BeTrue();
        options.CustomCss.Should().Be("*{}");
        options.HideDarkModeToggle.Should().BeTrue();
        options.ForceThemeMode.Should().Be(ThemeMode.Light);
        options.Servers.Should().HaveCount(2);
        options.Servers.Should().ContainSingle(x => x.Url == "https://example.com");
        options.Servers.Should().ContainSingle(x => x.Url == "https://example.org" && x.Description == "My other server");
        options.TagSorter.Should().Be(TagSorter.Alpha);
        options.EndpointPathPrefix.Should().Be("my-prefix");
        options.DefaultHttpClient.Should().Be(new KeyValuePair<ScalarTarget, ScalarClient>(ScalarTarget.CSharp, ScalarClient.HttpClient));
        options.Title.Should().Be("My title");
        options.Favicon.Should().Be("/favicon.png");
    }
}