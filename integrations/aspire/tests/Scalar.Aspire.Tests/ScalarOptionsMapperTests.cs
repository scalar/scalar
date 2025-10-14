using System.Runtime.CompilerServices;

namespace Scalar.Aspire.Tests;

public class ScalarOptionsMapperTests
{
    private static IEnumerable<ScalarConfiguration> GetConfigurations(IEnumerable<ScalarTestOptions> options)
    {
        var finalOptions = options.AsAsyncEnumerable(TestContext.Current.CancellationToken);
        var configurations = finalOptions.ToScalarConfigurationsAsync(TestContext.Current.CancellationToken).ToBlockingEnumerable(TestContext.Current.CancellationToken);
        return configurations;
    }

    [Fact]
    public void ToScalarConfigurations_ShouldReturnCorrectDefaultConfiguration()
    {
        // Arrange
        ScalarTestOptions[] options = [new()];

        // Act
        var configurations = GetConfigurations(options);

        // Assert
        var configuration = configurations.First();
        configuration.ProxyUrl.Should().BeNull();
        configuration.ShowSidebar.Should().BeNull();
        configuration.OperationTitleSource.Should().BeNull();
        configuration.HideModels.Should().BeNull();
        configuration.HideTestRequestButton.Should().BeNull();
        configuration.DarkMode.Should().BeNull();
        configuration.ForceDarkModeState.Should().BeNull();
        configuration.HideDarkModeToggle.Should().BeNull();
        configuration.CustomCss.Should().BeNull();
        configuration.SearchHotKey.Should().BeNull();
        configuration.Servers.Should().BeNull();
        configuration.MetaData.Should().BeNull();
        configuration.DefaultHttpClient.Should().BeNull();
        configuration.HiddenClients.Should().BeNull();
        configuration.Authentication.Should().BeNull();
        configuration.WithDefaultFonts.Should().BeNull();
        configuration.DefaultOpenAllTags.Should().BeNull();
        configuration.ExpandAllModelSections.Should().BeNull();
        configuration.ExpandAllResponses.Should().BeNull();
        configuration.HideSearch.Should().BeNull();
        configuration.TagSorter.Should().BeNull();
        configuration.OperationsSorter.Should().BeNull();
        configuration.Theme.Should().BeNull();
        configuration.Integration.Should().Be("dotnet");
        configuration.Sources.Should().BeEmpty();
        configuration.PersistAuth.Should().BeNull();
        configuration.DocumentDownloadType.Should().BeNull();
    }

    [Fact]
    public void ToConfiguration_ShouldReturnCorrectCustomConfiguration()
    {
        // Arrange
        var options = new ScalarTestOptions
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
            DefaultFonts = false,
            DefaultOpenAllTags = true,
            TagSorter = TagSorter.Alpha,
            OperationSorter = OperationSorter.Method,
            HideClientButton = true,
            PersistentAuthentication = true,
            DocumentDownloadType = DocumentDownloadType.Json
        };
        options.AddDocument("v2");

        // Act
        var configuration = options.ToScalarConfiguration();

        // Assert
        configuration.ProxyUrl.Should().Be("http://localhost:8080");
        configuration.ShowSidebar.Should().Be(false);
        configuration.OperationTitleSource.Should().Be(OperationTitleSource.Path);
        configuration.HideModels.Should().Be(true);
        configuration.HideTestRequestButton.Should().Be(true);
        configuration.DarkMode.Should().Be(false);
        configuration.HideDarkModeToggle.Should().Be(true);
        configuration.CustomCss.Should().Be("*{}");
        configuration.SearchHotKey.Should().Be("o");
        configuration.Servers.Should().ContainSingle().Which.Url.Should().Be("https://example.com");
        configuration.MetaData.Should().ContainKey("key").WhoseValue.Should().Be("value");
        configuration.DefaultHttpClient!.TargetKey.Should().Be(ScalarTarget.CSharp);
        configuration.DefaultHttpClient!.ClientKey.Should().Be(ScalarClient.HttpClient);
        ((bool) configuration.HiddenClients!).Should().BeTrue();
        configuration.WithDefaultFonts.Should().Be(false);
        configuration.DefaultOpenAllTags.Should().Be(true);
        configuration.TagSorter.Should().Be(TagSorter.Alpha);
        configuration.OperationsSorter.Should().Be(OperationSorter.Method);
        configuration.Theme.Should().Be(ScalarTheme.Saturn);
        configuration.Layout.Should().Be(ScalarLayout.Classic);
        configuration.Integration.Should().Be("dotnet");
        configuration.HideClientButton.Should().Be(true);
        configuration.Sources.Should().ContainSingle().Which.Url.Should().Be("openapi/v2.json");
        configuration.PersistAuth.Should().Be(true);
        configuration.DocumentDownloadType.Should().Be(DocumentDownloadType.Json);
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnNull_WhenEnabledTargetsAndEnabledClientsAreEmpty()
    {
        // Arrange
        var options = new ScalarTestOptions();

        // Act
        var hiddenClients = options.ToScalarConfiguration().HiddenClients;

        // Assert
        hiddenClients.Should().BeNull();
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnTrue_WhenHiddenClientsIsTrue()
    {
        // Arrange
        var options = new ScalarTestOptions { HiddenClients = true };

        // Act
        var hiddenClients = (bool) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().BeTrue();
    }

    [Fact]
    public void GetHiddenClients_ShouldReturnFilteredClients_WhenEnabledTargetsIsNotEmpty()
    {
        // Arrange
        var options = new ScalarTestOptions { EnabledTargets = [ScalarTarget.CSharp] };

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
        var options = new ScalarTestOptions { EnabledClients = [ScalarClient.HttpClient, ScalarClient.Python3] };

        // Act
        var hiddenClients = (IDictionary<ScalarTarget, ScalarClient[]>) options.ToScalarConfiguration().HiddenClients!;

        // Assert
        hiddenClients.Should().HaveCount(ScalarOptionsMapper.AvailableClientsByTarget.Count - 1);
        hiddenClients.Should().ContainKey(ScalarTarget.CSharp)
            .WhoseValue.Should().ContainSingle().Which.Should().Be(ScalarClient.RestSharp);
        hiddenClients.Should().ContainKey(ScalarTarget.Python)
            .WhoseValue.Should().BeEquivalentTo([ScalarClient.Requests, ScalarClient.HttpxSync, ScalarClient.HttpxAsync]);
    }

    [Fact]
    public void GetHiddenClients_ShouldNotReturnTarget_WhenAllClientsAreEnabled()
    {
        // Arrange
        var options = new ScalarTestOptions { EnabledClients = [ScalarClient.OkHttp] }; // All Kotlin clients are enabled

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
        var options = new ScalarTestOptions();
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
}

file static class ScalarTestOptionsExtensions
{
#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
    public static async IAsyncEnumerable<T> AsAsyncEnumerable<T>(this IEnumerable<T> enumerable, [EnumeratorCancellation] CancellationToken cancellationToken)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
    {
        foreach (var value in enumerable)
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return value;
        }
    }
}