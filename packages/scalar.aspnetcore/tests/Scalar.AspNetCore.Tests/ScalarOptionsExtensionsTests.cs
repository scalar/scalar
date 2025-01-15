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
            .WithDocumentNamesProvider(_ => Task.FromResult<IEnumerable<string>>(["v1"]))
            .AddHeadContent("<meta name=\"foo\" content=\"bar\"/>")
            .AddHeadContent("<meta name=\"bar\" content=\"foo\"/>")
            .AddHeaderContent("<h1>foo</h1>")
            .AddHeaderContent("<h2>bar</h2>");

        // Assert
        options.Title.Should().Be("My title");
        options.EndpointPathPrefix.Should().Be("/docs/{documentName}");
#pragma warning restore CS0618 // Type or member is obsolete
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
        options.OpenApiRoutePattern.Should().Be("swagger/{documentName}");
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
        options.DocumentNamesProvider.Should().NotBeNull();
        options.HeadContent.Should().Be("<meta name=\"foo\" content=\"bar\"/><meta name=\"bar\" content=\"foo\"/>");
        options.HeaderContent.Should().Be("<h1>foo</h1><h2>bar</h2>");
    }
}