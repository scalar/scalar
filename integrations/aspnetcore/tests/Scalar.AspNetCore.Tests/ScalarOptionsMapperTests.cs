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
        configuration.ProxyUrl.Should().BeNull();
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
        configuration.MetaData.Should().BeNull();
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
        configuration.Documents.Should().BeEmpty();
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
            Layout = ScalarLayout.Classic,
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
            DotNetFlag = false,
            HideClientButton = true
        };
        options.AddDocument("v2");

        // Act
        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.ProxyUrl.Should().Be("http://localhost:8080");
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
        configuration.MetaData.Should().ContainKey("key").WhoseValue.Should().Be("value");
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.CSharp.ToStringFast());
        configuration.DefaultHttpClient!.ClientKey.Should().Be(ScalarClient.HttpClient.ToStringFast());
        ((bool) configuration.HiddenClients!).Should().BeTrue();
        configuration.Authentication.Should().NotBeNull();
        configuration.Authentication!.PreferredSecurityScheme.Should().Be("my-scheme");
        configuration.Authentication.ApiKey.Should().NotBeNull();
        configuration.Authentication.ApiKey!.Token.Should().Be("my-token");
        configuration.WithDefaultFonts.Should().BeFalse();
        configuration.DefaultOpenAllTags.Should().BeTrue();
        configuration.TagSorter.Should().Be(TagSorter.Alpha.ToStringFast());
        configuration.OperationsSorter.Should().Be(OperationSorter.Method.ToStringFast());
        configuration.Theme.Should().Be(ScalarTheme.Saturn.ToStringFast());
        configuration.Layout.Should().Be(ScalarLayout.Classic.ToStringFast());
        configuration.Integration.Should().BeNull();
        configuration.HideClientButton.Should().BeTrue();
        configuration.Documents.Should().ContainSingle().Which.Should().Be("openapi/v2.json");
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
    public void GetHiddenClients_ShouldReturnTrue_WhenHiddenClientsIsTrue()
    {
        // Arrange
        var options = new ScalarOptions { HiddenClients = true };

        // Act
        var hiddenClients = (bool) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().BeTrue();
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnFilteredClients_WhenEnabledTargetsIsNotEmpty()
    {
        // Arrange
        var options = new ScalarOptions { EnabledTargets = [ScalarTarget.CSharp] };

        // Act
        var hiddenClients = (IDictionary<string, IEnumerable<string>>) options.ToScalarConfiguration().HiddenClients!;

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
        var hiddenClients = (IDictionary<string, IEnumerable<string>>) options.ToScalarConfiguration().HiddenClients!;

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
        var hiddenClients = (IDictionary<string, IEnumerable<string>>) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.ClientOptions.Count - 1);
        hiddenClients.Should().NotContainKey(ScalarTarget.Kotlin.ToStringFast());
    }
}