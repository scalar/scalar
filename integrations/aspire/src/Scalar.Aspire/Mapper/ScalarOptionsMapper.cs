using System.Runtime.CompilerServices;

namespace Scalar.Aspire;

internal static partial class ScalarOptionsMapper
{
    private const string DocumentName = "{documentName}";

    /// <summary>
    /// Mapping of targets to their available clients.
    /// This dictionary is auto-generated from TypeScript clients configuration.
    /// </summary>
    internal static partial Dictionary<ScalarTarget, ScalarClient[]> AvailableClientsByTarget { get; }

    internal static async IAsyncEnumerable<ScalarConfiguration> ToScalarConfigurationsAsync(this IAsyncEnumerable<ScalarOptions> options, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var option in options.WithCancellation(cancellationToken))
        {
            yield return option.ToScalarConfiguration();
        }
    }

    internal static ScalarConfiguration ToScalarConfiguration(this ScalarOptions options)
    {
        var sources = GetSources(options);
        return new ScalarConfiguration
        {
            ProxyUrl = options.ProxyUrl,
            Theme = options.Theme?.ToStringFast(true),
            Layout = options.Layout?.ToStringFast(true),
            DarkMode = options.DarkMode,
            HideModels = options.HideModels,
            HideDarkModeToggle = options.HideDarkModeToggle,
            HideTestRequestButton = options.HideTestRequestButton,
            DefaultOpenAllTags = options.DefaultOpenAllTags,
            ForceDarkModeState = options.ForceThemeMode?.ToStringFast(true),
            ShowSidebar = options.ShowSidebar,
            OperationTitleSource = options.OperationTitleSource?.ToStringFast(true),
            WithDefaultFonts = options.DefaultFonts,
            CustomCss = options.CustomCss,
            SearchHotKey = options.SearchHotKey,
            Servers = options.Servers,
            MetaData = options.Metadata,
            Authentication = options.Authentication,
            TagsSorter = options.TagSorter?.ToStringFast(true),
            OperationsSorter = options.OperationSorter?.ToStringFast(true),
            HiddenClients = options.HiddenClients ? options.HiddenClients : GetHiddenClients(options),
            DefaultHttpClient = new DefaultHttpClient
            {
                ClientKey = options.DefaultHttpClient.Value.ToStringFast(true),
                TargetKey = options.DefaultHttpClient.Key.ToStringFast(true)
            },
            HideClientButton = options.HideClientButton,
            Sources = sources,
            BaseServerUrl = options.BaseServerUrl,
            PersistAuth = options.PersistentAuthentication,
            DocumentDownloadType = options.DocumentDownloadType?.ToStringFast(true),
            OrderRequiredPropertiesFirst = options.OrderRequiredPropertiesFirst,
            OrderSchemaPropertiesBy = options.SchemaPropertyOrder?.ToStringFast(true),
            ShowOperationId = options.ShowOperationId
        };
    }

    private static IEnumerable<ScalarSource> GetSources(ScalarOptions options)
    {
        var trimmedOpenApiRoutePattern = options.OpenApiRoutePattern.TrimStart('/');

        foreach (var (name, title, routePattern, isDefault) in options.Documents)
        {
            var openApiRoutePattern = routePattern is null ? trimmedOpenApiRoutePattern : routePattern.TrimStart('/');
            yield return new ScalarSource
            {
                Title = title ?? name,
                Url = openApiRoutePattern.Replace(DocumentName, name),
                Default = isDefault
            };
        }
    }

    private static Dictionary<ScalarTarget, ScalarClient[]>? GetHiddenClients(ScalarOptions options)
    {
        if (options.EnabledTargets.Length == 0 && options.EnabledClients.Length == 0)
        {
            return null;
        }

        var hiddenClients = new Dictionary<ScalarTarget, ScalarClient[]>(AvailableClientsByTarget.Count);

        foreach (var (scalarTarget, scalarClients) in AvailableClientsByTarget)
        {
            if (options.EnabledTargets.Length > 0 && !options.EnabledTargets.Contains(scalarTarget))
            {
                hiddenClients[scalarTarget] = scalarClients;
                continue;
            }

            if (options.EnabledClients.Length == 0)
            {
                continue;
            }

            var clients = scalarClients.Where(x => !options.EnabledClients.Contains(x)).ToArray();

            // Only add to hidden clients if there are actually clients to hide
            if (clients.Length == 0)
            {
                continue;
            }

            hiddenClients[scalarTarget] = clients;
        }

        return hiddenClients.Count > 0 ? hiddenClients : null;
    }
}