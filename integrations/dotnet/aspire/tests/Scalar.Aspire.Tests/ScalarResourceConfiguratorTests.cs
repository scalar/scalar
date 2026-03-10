using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.Aspire.Tests;

/// <summary>
/// Tests the content of API_REFERENCE_CONFIG produced by <see cref="ScalarResourceConfigurator"/>.
/// Each test builds a minimal Aspire execution context, runs the configurator, and asserts on the
/// resulting JSON — the same value the Scalar container reads at startup.
/// </summary>
public class ScalarResourceConfiguratorTests
{
    private const string ScalarResourceName = "scalar";
    private const string ApiResourceName = "my-api";

    // Builds a minimal context that mirrors WithApiReference(resourceBuilder) for the default (non-file) case.
    // When baseDocumentUrl is provided it mirrors WithApiReference(resourceBuilder, fileInfo) instead.
    private static async Task<JsonElement[]> GetConfigAsync(
        IResource apiResource,
        Func<ScalarOptions, CancellationToken, Task>? userCallback = null,
        bool publishMode = false,
        ReferenceExpression? baseDocumentUrl = null)
    {
        ScalarAnnotation annotation;
        if (baseDocumentUrl is null)
        {
            // Mirror WithApiReference(resourceBuilder): create the endpoint expression at "build time" and
            // configure it inside the callback after user options are applied.
            var endpointExpression = new ResourceBaseUrlExpression(apiResource);
            var endpointUrl = ReferenceExpression.Create($"{endpointExpression}");
            annotation = new ScalarAnnotation(apiResource, async (options, ct) =>
            {
                if (userCallback is not null) await userCallback(options, ct);
                endpointExpression.Configure(((ScalarAspireOptions)options).DefaultProxy, options.PreferHttpsEndpoint);
            }, BaseDocumentUrl: endpointUrl);
        }
        else
        {
            // Mirror WithApiReference(resourceBuilder, fileInfo): BaseDocumentUrl is fixed (e.g. Empty).
            annotation = new ScalarAnnotation(apiResource, userCallback, baseDocumentUrl);
        }

        var scalarResource = new ScalarResource(ScalarResourceName);
        scalarResource.Annotations.Add(annotation);

        var services = new ServiceCollection();
        services.AddOptions<ScalarAspireOptions>(ScalarResourceName);
        var serviceProvider = services.BuildServiceProvider();

        var executionContextOptions = new DistributedApplicationExecutionContextOptions(
            publishMode ? DistributedApplicationOperation.Publish : DistributedApplicationOperation.Run)
        {
            ServiceProvider = serviceProvider
        };
        var executionContext = new DistributedApplicationExecutionContext(executionContextOptions);

        var envVars = new Dictionary<string, object>();
        var context = new EnvironmentCallbackContext(executionContext, scalarResource, envVars);

        await ScalarResourceConfigurator.ConfigureScalarResourceAsync(context);

        var raw = (string)envVars[EnvironmentVariables.ApiReferenceConfig];
        return JsonDocument.Parse(raw).RootElement.EnumerateArray().ToArray();
    }

    // Creates a default-case annotation (mirrors WithApiReference(resourceBuilder)) suitable for multi-annotation tests.
    private static ScalarAnnotation DefaultAnnotation(IResource apiResource)
    {
        var endpointExpression = new ResourceBaseUrlExpression(apiResource);
        var endpointUrl = ReferenceExpression.Create($"{endpointExpression}");
        return new ScalarAnnotation(apiResource, (options, _) =>
        {
            endpointExpression.Configure(((ScalarAspireOptions)options).DefaultProxy, options.PreferHttpsEndpoint);
            return Task.CompletedTask;
        }, BaseDocumentUrl: endpointUrl);
    }

    private static ContainerResource HttpApiResource(string name = ApiResourceName, int port = 5000)
    {
        var resource = new ContainerResource(name);
        resource.Annotations.Add(new EndpointAnnotation(ProtocolType.Tcp, uriScheme: "http", targetPort: port) { TargetHost = "localhost" });
        return resource;
    }

    // ---------------------------------------------------------------------------

    [Fact]
    public async Task DefaultConfig_SourceUrlContainsResourceUrlAndDefaultPattern()
    {
        // With DefaultProxy=true (the default) the resource URL uses service-discovery naming.
        // The default OpenApiRoutePattern is /openapi/{documentName}.json.
        var configs = await GetConfigAsync(HttpApiResource());

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be($"http://{ApiResourceName}/openapi/v1.json");
    }

    [Fact]
    public async Task DefaultConfig_DocumentTitleIsPrefixedWithResourceName()
    {
        var configs = await GetConfigAsync(HttpApiResource());

        var titleValue = configs[0].GetProperty("sources")[0].GetProperty("title").GetString();
        titleValue.Should().Be($"{ApiResourceName} | v1");
    }

    [Fact]
    public async Task DefaultConfig_ServerUrlMatchesResourceUrl()
    {
        var configs = await GetConfigAsync(HttpApiResource());

        var serverUrl = configs[0].GetProperty("servers")[0].GetProperty("url").GetString();
        serverUrl.Should().Be($"http://{ApiResourceName}");
    }

    [Fact]
    public async Task WithoutProxy_SourceUrlUsesAllocatedHostAndPort()
    {
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) => { ((ScalarAspireOptions)options).DefaultProxy = false; return Task.CompletedTask; });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("http://localhost:5000/openapi/v1.json");
    }

    [Fact]
    public async Task PreferHttps_SourceUrlUsesHttps()
    {
        var resource = new ContainerResource(ApiResourceName);
        resource.Annotations.Add(new EndpointAnnotation(ProtocolType.Tcp, uriScheme: "http", targetPort: 5000) { TargetHost = "localhost" });
        resource.Annotations.Add(new EndpointAnnotation(ProtocolType.Tcp, uriScheme: "https", targetPort: 5001) { TargetHost = "localhost" });

        var configs = await GetConfigAsync(resource, (options, _) =>
        {
            options.PreferHttpsEndpoint = true;
            ((ScalarAspireOptions)options).DefaultProxy = false;
            return Task.CompletedTask;
        });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().StartWith("https://localhost:5001");
    }

    [Fact]
    public async Task StaticFile_SourceUrlIsPatternWithoutResourcePrefix()
    {
        // When BaseDocumentUrl = ReferenceExpression.Empty (on the annotation, as WithApiReference(fileInfo) sets it)
        // the document is served from the Scalar container, so the source URL must be the plain path only.
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.OpenApiRoutePattern = "/openapi/spec.yaml";
                options.AddDocument("spec");
                return Task.CompletedTask;
            },
            baseDocumentUrl: ReferenceExpression.Empty);

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("openapi/spec.yaml");
    }

    [Fact]
    public async Task StaticFile_WithNoExplicitDocument_SourceUrlIsFilePathOnly()
    {
        // Mirrors what WithApiReference(resourceBuilder, fileInfo) does: BaseDocumentUrl is on the annotation,
        // OpenApiRoutePattern is set in the callback, no AddDocument call — ConfigureDocuments supplies "v1".
        // The source URL must be the plain file path, not prefixed with the service URL.
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.OpenApiRoutePattern = "/openapi/books.yaml";
                return Task.CompletedTask;
            },
            baseDocumentUrl: ReferenceExpression.Empty);

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("openapi/books.yaml");
    }

    [Fact]
    public async Task StaticFile_UserCallbackCannotOverrideAnnotationBaseDocumentUrl()
    {
        // The annotation's BaseDocumentUrl = Empty cannot be cleared by the user's callback accidentally
        // overriding scalarOptions.BaseDocumentUrl back to null. This test guards against that regression:
        // even if the user's callback sets options.OpenApiRoutePattern to something, the base URL from
        // the annotation still governs — the resource URL must NOT be prepended.
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                // The user customises the route pattern but does not touch BaseDocumentUrl.
                // In the old design the annotation set options.BaseDocumentUrl in the callback, so a
                // subsequent library-authored step could have cleared it. In the new design the annotation
                // owns BaseDocumentUrl and options.BaseDocumentUrl is reserved for explicit user overrides.
                options.OpenApiRoutePattern = "/openapi/custom.yaml";
                return Task.CompletedTask;
            },
            baseDocumentUrl: ReferenceExpression.Empty);

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        // Must be the plain path — the service URL (e.g. http://my-api) must NOT be prepended.
        url.Should().Be("openapi/custom.yaml");
        url.Should().NotStartWith("http");
    }

    [Fact]
    public async Task StaticFile_WithFolderPath_SourceUrlIncludesFolder()
    {
        // Mirrors WithApiReference(resourceBuilder, fileInfo, folderPath: "my-service"):
        // the route pattern becomes /openapi/my-service/spec.yaml, so the source URL must be
        // openapi/my-service/spec.yaml (no service URL prefix, since BaseDocumentUrl is Empty).
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.OpenApiRoutePattern = "/openapi/my-service/spec.yaml";
                return Task.CompletedTask;
            },
            baseDocumentUrl: ReferenceExpression.Empty);

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("openapi/my-service/spec.yaml");
        url.Should().NotStartWith("http");
    }

    [Fact]
    public async Task StaticFile_NoFolderPath_DefaultsToResourceName()
    {
        // When folderPath is not specified, WithApiReference uses resourceBuilder.Resource.Name as the folder.
        // The route pattern becomes /openapi/{resourceName}/{filename}, so the source URL must reflect that.
        const string resourceName = ApiResourceName; // "my-api"
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.OpenApiRoutePattern = $"/openapi/{resourceName}/spec.yaml";
                return Task.CompletedTask;
            },
            baseDocumentUrl: ReferenceExpression.Empty);

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be($"openapi/{resourceName}/spec.yaml");
        url.Should().NotStartWith("http");
    }

    [Fact]
    public async Task StaticFile_WithNestedFolderPath_SourceUrlIncludesFullFolderHierarchy()
    {
        // Verifies that multi-level folder paths (e.g. "org/team") are preserved verbatim.
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.OpenApiRoutePattern = "/openapi/org/team/api.json";
                return Task.CompletedTask;
            },
            baseDocumentUrl: ReferenceExpression.Empty);

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("openapi/org/team/api.json");
    }

    [Fact]
    public async Task WithBaseDocumentUrl_CustomExpression_OverridesAnnotationEndpoint()
    {
        // When the user explicitly calls options.WithBaseDocumentUrl(expression) in their callback,
        // that expression takes priority over the annotation's endpoint URL.
        var customBase = ReferenceExpression.Create($"https://gateway.example.com");

        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.WithBaseDocumentUrl(customBase);
                return Task.CompletedTask;
            });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().StartWith("https://gateway.example.com/openapi/v1.json");
    }

    [Fact]
    public async Task WithBaseDocumentUrl_Empty_OverridesAnnotationEndpointAndUsesPatternAsIs()
    {
        // The user can suppress base-URL prepending on a live-endpoint reference by explicitly
        // calling options.WithBaseDocumentUrl(ReferenceExpression.Empty) in their callback.
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.WithBaseDocumentUrl(ReferenceExpression.Empty);
                options.OpenApiRoutePattern = "/openapi/override.yaml";
                return Task.CompletedTask;
            });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("openapi/override.yaml");
        url.Should().NotStartWith("http");
    }

    [Fact]
    public async Task AbsoluteOpenApiRoutePattern_IsNotModified()
    {
        const string externalUrl = "https://external.example.com/openapi.json";

        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.OpenApiRoutePattern = externalUrl;
                return Task.CompletedTask;
            });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be(externalUrl);
    }

    [Fact]
    public async Task MultipleAnnotations_ProducesOneEntryPerApiResource()
    {
        var scalarResource = new ScalarResource(ScalarResourceName);
        scalarResource.Annotations.Add(DefaultAnnotation(HttpApiResource("api-one", 5000)));
        scalarResource.Annotations.Add(DefaultAnnotation(HttpApiResource("api-two", 5001)));

        var services = new ServiceCollection();
        services.AddOptions<ScalarAspireOptions>(ScalarResourceName);
        var serviceProvider = services.BuildServiceProvider();

        var executionContext = new DistributedApplicationExecutionContext(
            new DistributedApplicationExecutionContextOptions(DistributedApplicationOperation.Run)
            {
                ServiceProvider = serviceProvider
            });

        var envVars = new Dictionary<string, object>();
        await ScalarResourceConfigurator.ConfigureScalarResourceAsync(
            new EnvironmentCallbackContext(executionContext, scalarResource, envVars));

        var configs = JsonDocument.Parse((string)envVars[EnvironmentVariables.ApiReferenceConfig])
            .RootElement.EnumerateArray().ToArray();

        configs.Should().HaveCount(2);
        configs[0].GetProperty("sources")[0].GetProperty("url").GetString().Should().Contain("api-one");
        configs[1].GetProperty("sources")[0].GetProperty("url").GetString().Should().Contain("api-two");
    }

    [Fact]
    public async Task PublishMode_ValueIsBase64Encoded()
    {
        var scalarResource = new ScalarResource(ScalarResourceName);
        scalarResource.Annotations.Add(DefaultAnnotation(HttpApiResource()));

        var services = new ServiceCollection();
        services.AddOptions<ScalarAspireOptions>(ScalarResourceName);
        var serviceProvider = services.BuildServiceProvider();

        var executionContext = new DistributedApplicationExecutionContext(
            new DistributedApplicationExecutionContextOptions(DistributedApplicationOperation.Publish)
            {
                ServiceProvider = serviceProvider
            });

        var envVars = new Dictionary<string, object>();
        await ScalarResourceConfigurator.ConfigureScalarResourceAsync(
            new EnvironmentCallbackContext(executionContext, scalarResource, envVars));

        var raw = (string)envVars[EnvironmentVariables.ApiReferenceConfig];

        // The value must be valid Base64 that decodes to a JSON array.
        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(raw));
        JsonDocument.Parse(decoded).RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }
}
