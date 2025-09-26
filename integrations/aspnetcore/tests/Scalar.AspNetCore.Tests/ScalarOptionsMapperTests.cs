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
        configuration.OperationTitleSource.Should().BeNull();
        configuration.HideModels.Should().BeFalse();
        configuration.DocumentDownloadType.Should().BeNull();
        configuration.HideTestRequestButton.Should().BeFalse();
        configuration.DarkMode.Should().BeTrue();
        configuration.ForceDarkModeState.Should().BeNull();
        configuration.HideDarkModeToggle.Should().BeFalse();
        configuration.CustomCss.Should().BeNull();
        configuration.SearchHotKey.Should().BeNull();
        configuration.Servers.Should().BeNull();
        configuration.MetaData.Should().BeNull();
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.Shell);
        configuration.DefaultHttpClient!.ClientKey.Should().Be(ScalarClient.Curl);
        configuration.HiddenClients.Should().BeNull();
        configuration.Authentication.Should().BeNull();
        configuration.WithDefaultFonts.Should().BeTrue();
        configuration.DefaultOpenAllTags.Should().BeFalse();
        configuration.TagSorter.Should().BeNull();
        configuration.OperationsSorter.Should().BeNull();
        configuration.Theme.Should().Be(ScalarTheme.Purple);
        configuration.Integration.Should().Be("dotnet");
        configuration.Sources.Should().BeEmpty();
        configuration.PersistAuth.Should().BeFalse();
        configuration.OrderRequiredPropertiesFirst.Should().BeFalse();
        configuration.OrderSchemaPropertiesBy.Should().BeNull();
    }

    [Fact]
    public void ToConfiguration_ShouldReturnCorrectCustomConfiguration()
    {
        // Arrange
        var options = new ScalarOptions
        {
            ProxyUrl = "http://localhost:8080",
            ShowSidebar = false,
            OperationTitleSource = OperationTitleSource.Path,
            HideModels = true,
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
#pragma warning disable CS0618 // Type or member is obsolete
            HideDownloadButton = true,
            Authentication = new ScalarAuthenticationOptions
            {
                PreferredSecurityScheme = "my-scheme",
                ApiKey = new ApiKeyOptions
                {
                    Token = "my-token"
                }
#pragma warning restore CS0618 // Type or member is obsolete
            },
            DefaultFonts = false,
            DefaultOpenAllTags = true,
            TagSorter = TagSorter.Alpha,
            OperationSorter = OperationSorter.Method,
            DotNetFlag = false,
            HideClientButton = true,
            PersistentAuthentication = true,
            OrderRequiredPropertiesFirst = true,
            SchemaPropertyOrder = PropertyOrder.Alpha
        };
        options.AddDocument("v2");

        // Act
        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.ProxyUrl.Should().Be("http://localhost:8080");
        configuration.ShowSidebar.Should().BeFalse();
        configuration.OperationTitleSource.Should().Be(OperationTitleSource.Path);
        configuration.HideModels.Should().BeTrue();
        configuration.DocumentDownloadType.Should().Be(DocumentDownloadType.None);
        configuration.HideTestRequestButton.Should().BeTrue();
        configuration.DarkMode.Should().BeFalse();
        configuration.HideDarkModeToggle.Should().BeTrue();
        configuration.CustomCss.Should().Be("*{}");
        configuration.SearchHotKey.Should().Be("o");
        configuration.Servers.Should().ContainSingle().Which.Url.Should().Be("https://example.com");
        configuration.MetaData.Should().ContainKey("key").WhoseValue.Should().Be("value");
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.CSharp);
        configuration.DefaultHttpClient!.ClientKey.Should().Be(ScalarClient.HttpClient);
        ((bool) configuration.HiddenClients!).Should().BeTrue();
        configuration.Authentication.Should().NotBeNull();
#pragma warning disable CS0618 // Type or member is obsolete
        configuration.Authentication!.PreferredSecurityScheme.Should().Be("my-scheme");
        configuration.Authentication.ApiKey.Should().NotBeNull();
        configuration.Authentication.ApiKey!.Token.Should().Be("my-token");
#pragma warning restore CS0618 // Type or member is obsolete
        configuration.WithDefaultFonts.Should().BeFalse();
        configuration.DefaultOpenAllTags.Should().BeTrue();
        configuration.TagSorter.Should().Be(TagSorter.Alpha);
        configuration.OperationsSorter.Should().Be(OperationSorter.Method);
        configuration.Theme.Should().Be(ScalarTheme.Saturn);
        configuration.Layout.Should().Be(ScalarLayout.Classic);
        configuration.Integration.Should().BeNull();
        configuration.HideClientButton.Should().BeTrue();
        configuration.Sources.Should().ContainSingle().Which.Url.Should().Be("openapi/v2.json");
        configuration.PersistAuth.Should().BeTrue();
        configuration.OrderRequiredPropertiesFirst.Should().BeTrue();
        configuration.OrderSchemaPropertiesBy.Should().Be(PropertyOrder.Alpha);
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
        var hiddenClients = (IDictionary<ScalarTarget, ScalarClient[]>) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.AvailableClientsByTarget.Count - 1);
        hiddenClients.Should().NotContainKey(ScalarTarget.CSharp);
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnFilteredClients_WhenEnabledClientsIsNotEmpty()
    {
        // Arrange
        var options = new ScalarOptions { EnabledClients = [ScalarClient.HttpClient, ScalarClient.Python3] };

        // Act
        var hiddenClients = (IDictionary<ScalarTarget, ScalarClient[]>) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.AvailableClientsByTarget.Count);
        hiddenClients.Should().ContainKey(ScalarTarget.CSharp)
            .WhoseValue.Should().ContainSingle().Which.Should().Be(ScalarClient.RestSharp);
        hiddenClients.Should().ContainKey(ScalarTarget.Python)
            .WhoseValue.Should().BeEquivalentTo([ScalarClient.Requests, ScalarClient.HttpxSync, ScalarClient.HttpxAsync]);
    }

    [Fact]
    public void GetHiddenClients_ShouldNotReturnTarget_WhenAllClientsAreEnabled()
    {
        // Arrange
        var options = new ScalarOptions { EnabledClients = [ScalarClient.OkHttp] }; // All Kotlin clients are enabled

        // Act
        var hiddenClients = (IDictionary<ScalarTarget, ScalarClient[]>) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.AvailableClientsByTarget.Count - 1);
        hiddenClients.Should().NotContainKey(ScalarTarget.Kotlin);
    }

    [Fact]
    public void GetSources_ShouldUseCorrectPattern_WhenCustomPatternIsProvided()
    {
        // Arrange
        var options = new ScalarOptions();
        options
            .AddDocument("default")
            .AddDocument("custom", routePattern: "/external/{documentName}.json");

        // Act 
        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.Sources.Should()
            .SatisfyRespectively(
                first => first.Url.Should().Be("openapi/default.json"),
                second => second.Url.Should().Be("external/custom.json")
            );
    }

    [Fact]
    public void PreferredSecurityScheme_ShouldOverridePreferredSecuritySchemes_WhenSet()
    {
        // Arrange
        var options = new ScalarOptions
        {
            // Act
            Authentication = new ScalarAuthenticationOptions
            {
#pragma warning disable CS0618 // Type or member is obsolete
                PreferredSecurityScheme = "my-scheme"
#pragma warning restore CS0618 // Type or member is obsolete
            }
        };

        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.Authentication!.PreferredSecuritySchemes.Should().ContainSingle().Which.Should().Be("my-scheme");
    }
}