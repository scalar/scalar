namespace Scalar.AspNetCore;

internal static partial class ScalarOptionsMapper
{
    private const string DocumentName = "{documentName}";

    /// <summary>
    /// Mapping of targets to their available clients.
    /// This dictionary is auto-generated from TypeScript clients configuration.
    /// </summary>
    internal static partial Dictionary<ScalarTarget, ScalarClient[]> AvailableClientsByTarget { get; }

    internal static ScalarConfiguration ToScalarConfiguration(this ScalarOptions options)
    {
        var sources = GetSources(options);
        return new ScalarConfiguration
        {
            ProxyUrl = options.ProxyUrl,
            Theme = options.Theme,
            Layout = options.Layout,
            Favicon = options.Favicon,
            DarkMode = options.DarkMode,
            HideModels = options.HideModels,
            HideDarkModeToggle = options.HideDarkModeToggle,
            HideTestRequestButton = options.HideTestRequestButton,
            DefaultOpenAllTags = options.DefaultOpenAllTags,
            ForceDarkModeState = options.ForceThemeMode,
            ShowSidebar = options.ShowSidebar,
            OperationTitleSource = options.OperationTitleSource,
            WithDefaultFonts = options.DefaultFonts,
            CustomCss = options.CustomCss,
            SearchHotKey = options.SearchHotKey,
            Servers = options.Servers,
            MetaData = options.Metadata,
            Authentication = options.Authentication,
            TagSorter = options.TagSorter,
            OperationsSorter = options.OperationSorter,
            HiddenClients = options.HiddenClients ? options.HiddenClients : GetHiddenClients(options),
            DefaultHttpClient = new DefaultHttpClient
            {
                ClientKey = options.DefaultHttpClient.Value,
                TargetKey = options.DefaultHttpClient.Key
            },
            Integration = options.DotNetFlag ? "dotnet" : null,
            HideClientButton = options.HideClientButton,
            Sources = sources,
            BaseServerUrl = options.BaseServerUrl,
            PersistAuth = options.PersistentAuthentication,
#pragma warning disable CS0618 // Type or member is obsolete
            DocumentDownloadType = options.HideDownloadButton ? DocumentDownloadType.None : options.DocumentDownloadType,
#pragma warning restore CS0618 // Type or member is obsolete
            OrderRequiredPropertiesFirst = options.OrderRequiredPropertiesFirst,
            OrderSchemaPropertiesBy = options.SchemaPropertyOrder
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