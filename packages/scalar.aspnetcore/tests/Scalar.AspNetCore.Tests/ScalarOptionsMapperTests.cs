namespace Scalar.AspNetCore.Tests;

public class ScalarOptionsMapperTests
{
    [Fact]
    public void ToConfiguration_ShouldReturnCorrectDefaultConfiguration()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.Proxy.Should().BeNull();
        configuration.ShowSidebar.Should().BeTrue();
        configuration.HideModels.Should().BeFalse();
        configuration.HideDownloadButton.Should().BeFalse();
        configuration.HideTestRequestButton.Should().BeFalse();
        configuration.DarkMode.Should().BeTrue();
        configuration.ForceDarkModeState.Should().BeNull();
        configuration.HideDarkModeToggle.Should().BeFalse();
        configuration.CustomCss.Should().BeNull();
        configuration.SearchHotKey.Should().BeNull();
        configuration.Servers.Should().BeNull();
        configuration.Metadata.Should().BeNull();
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.Shell.ToStringFast());
        configuration.DefaultHttpClient!.ClientKey.Should().Be(ScalarClient.Curl.ToStringFast());
        configuration.HiddenClients.Should().BeNull();
        configuration.Authentication.Should().BeNull();
        configuration.WithDefaultFonts.Should().BeTrue();
        configuration.DefaultOpenAllTags.Should().BeFalse();
        configuration.TagSorter.Should().BeNull();
        configuration.OperationsSorter.Should().BeNull();
        configuration.Theme.Should().Be(ScalarTheme.Purple.ToStringFast());
        configuration.Integration.Should().Be("dotnet");
    }

    [Fact]
    public void ToConfiguration_ShouldReturnCorrectCustomConfiguration()
    {
        // Arrange
        var options = new ScalarOptions
        {
            ProxyUrl = "http://localhost:8080",
            ShowSidebar = false,
            HideModels = true,
            HideDownloadButton = true,
            HideTestRequestButton = true,
            DarkMode = false,
            ForceThemeMode = ThemeMode.Light,
            HideDarkModeToggle = true,
            CustomCss = "*{}",
            SearchHotKey = "o",
            Theme = ScalarTheme.Saturn,
            Servers = [new ScalarServer("https://example.com")],
            Metadata = new Dictionary<string, string> { ["key"] = "value" },
            DefaultHttpClient = new KeyValuePair<ScalarTarget, ScalarClient>(ScalarTarget.CSharp, ScalarClient.HttpClient),
            HiddenClients = true,
            Authentication = new ScalarAuthenticationOptions
            {
                PreferredSecurityScheme = "my-scheme",
                ApiKey = new ApiKeyOptions
                {
                    Token = "my-token"
                }
            },
            DefaultFonts = false,
            DefaultOpenAllTags = true,
            TagSorter = TagSorter.Alpha,
            OperationSorter = OperationSorter.Method,
            DotNetFlag = false
        };

        // Act
        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.Proxy.Should().Be("http://localhost:8080");
        configuration.ShowSidebar.Should().BeFalse();
        configuration.HideModels.Should().BeTrue();
        configuration.HideDownloadButton.Should().BeTrue();
        configuration.HideTestRequestButton.Should().BeTrue();
        configuration.DarkMode.Should().BeFalse();
        configuration.ForceDarkModeState.Should().Be(ThemeMode.Light.ToStringFast());
        configuration.HideDarkModeToggle.Should().BeTrue();
        configuration.CustomCss.Should().Be("*{}");
        configuration.SearchHotKey.Should().Be("o");
        configuration.Servers.Should().ContainSingle().Which.Url.Should().Be("https://example.com");
        configuration.Metadata.Should().ContainKey("key").WhoseValue.Should().Be("value");
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.CSharp.ToStringFast());
        configuration.DefaultHttpClient!.ClientKey.Should().Be(ScalarClient.HttpClient.ToStringFast());
        configuration.HiddenClients.Should().ContainKeys(ScalarOptionsMapper.ClientOptions.Keys.Select(x => x.ToStringFast()));
        configuration.Authentication.Should().NotBeNull();
        configuration.Authentication!.PreferredSecurityScheme.Should().Be("my-scheme");
        configuration.Authentication.ApiKey.Should().NotBeNull();
        configuration.Authentication.ApiKey!.Token.Should().Be("my-token");
        configuration.WithDefaultFonts.Should().BeFalse();
        configuration.DefaultOpenAllTags.Should().BeTrue();
        configuration.TagSorter.Should().Be(TagSorter.Alpha.ToStringFast());
        configuration.OperationsSorter.Should().Be(OperationSorter.Method.ToStringFast());
        configuration.Theme.Should().Be(ScalarTheme.Saturn.ToStringFast());
        configuration.Integration.Should().BeNull();
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnNull_WhenEnabledTargetsAndEnabledClientsAreEmpty()
    {
        // Arrange
        var options = new ScalarOptions();

        // Act
        var hiddenClients = options.ToScalarConfiguration().HiddenClients;

        // Assert
        hiddenClients.Should().BeNull();
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnAllClients_WhenHiddenClientsIsTrue()
    {
        // Arrange
        var options = new ScalarOptions { HiddenClients = true };

        // Act
        var hiddenClients = options.ToScalarConfiguration().HiddenClients;

        // Assert
        hiddenClients.Should().ContainKeys(ScalarOptionsMapper.ClientOptions.Keys.Select(x => x.ToStringFast()));
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnFilteredClients_WhenEnabledTargetsIsNotEmpty()
    {
        // Arrange
        var options = new ScalarOptions { EnabledTargets = [ScalarTarget.CSharp] };

        // Act
        var hiddenClients = options.ToScalarConfiguration().HiddenClients;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.ClientOptions.Count - 1);
        hiddenClients.Should().NotContainKey(ScalarTarget.CSharp.ToStringFast());
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnFilteredClients_WhenEnabledClientsIsNotEmpty()
    {
        // Arrange
        var options = new ScalarOptions { EnabledClients = [ScalarClient.HttpClient, ScalarClient.Python3] };

        // Act
        var hiddenClients = options.ToScalarConfiguration().HiddenClients;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.ClientOptions.Count);
        hiddenClients.Should().ContainKey(ScalarTarget.CSharp.ToStringFast())
            .WhoseValue.Should().ContainSingle().Which.Should().Be(ScalarClient.RestSharp.ToStringFast());
        hiddenClients.Should().ContainKey(ScalarTarget.Python.ToStringFast())
            .WhoseValue.Should().ContainSingle().Which.Should().Be(ScalarClient.Requests.ToStringFast());
    }

    [Fact]
    public void GetHiddenClients_ShouldNotReturnTarget_WhenAllClientsAreEnabled()
    {
        // Arrange
        var options = new ScalarOptions { EnabledClients = [ScalarClient.OkHttp] }; // All Kotlin clients are enabled

        // Act
        var hiddenClients = options.ToScalarConfiguration().HiddenClients;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.ClientOptions.Count - 1);
        hiddenClients.Should().NotContainKey(ScalarTarget.Kotlin.ToStringFast());
    }
}