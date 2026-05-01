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
    public async Task DefaultConfig_BaseServerUrlMatchesResourceUrl()
    {
        var configs = await GetConfigAsync(HttpApiResource());

        var baseServerUrl = configs[0].GetProperty("baseServerURL").GetString();
        baseServerUrl.Should().Be($"http://{ApiResourceName}");
    }

    [Fact]
    public async Task DefaultConfig_DoesNotInjectServersOverride()
    {
        var configs = await GetConfigAsync(HttpApiResource());

        configs[0].TryGetProperty("servers", out _).Should().BeFalse();
    }

    [Fact]
    public async Task ExistingLocalhostServer_IsRebasedThroughBaseServerUrl_PreservingPath()
    {
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.AddServer("http://localhost:65312/api");
                return Task.CompletedTask;
            });

        var serverUrl = configs[0].GetProperty("servers")[0].GetProperty("url").GetString();
        var baseServerUrl = configs[0].GetProperty("baseServerURL").GetString();

        serverUrl.Should().Be("http://localhost:65312/api");
        baseServerUrl.Should().Be($"http://{ApiResourceName}");
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
    public async Task CustomDocumentRoutePattern_ReplacesDefaultPatternInsteadOfConcatenating()
    {
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.AddDocument("c2", "Custom API", routePattern: "/custom/{documentName}.json");
                return Task.CompletedTask;
            });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be($"http://{ApiResourceName}/custom/c2.json");
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

    // ---------------------------------------------------------------------------
    // Service-discovery environment variable tests
    //
    // WithApiReference forwards endpointName to Aspire's WithReference, which injects
    // services__{resourceName}__{scheme}__{index} environment variables into the Scalar container.
    // These tests verify the correct endpoints are exposed for a given endpointName value.
    // ---------------------------------------------------------------------------

    // ContainerResource alone does not implement IResourceWithServiceDiscovery, which is the
    // constraint on WithApiReference. This minimal subclass satisfies that constraint without
    // requiring project metadata or DCP infrastructure.
    private sealed class TestApiResource(string name) : ContainerResource(name), IResourceWithServiceDiscovery;

    // Minimal IResourceBuilder<T> that supports annotation mutations only. This is all that
    // WithReference and WithApiReference need — neither accesses ApplicationBuilder during setup.
    private sealed class MinimalResourceBuilder<T>(T resource) : IResourceBuilder<T> where T : IResource
    {
        public T Resource { get; } = resource;

        public IDistributedApplicationBuilder ApplicationBuilder =>
            throw new NotSupportedException("ApplicationBuilder is not available in minimal tests.");

        public IResourceBuilder<T> WithAnnotation<TAnnotation>(
            TAnnotation annotation,
            ResourceAnnotationMutationBehavior behavior = ResourceAnnotationMutationBehavior.Append)
            where TAnnotation : IResourceAnnotation
        {
            if (behavior == ResourceAnnotationMutationBehavior.Replace)
            {
                var toRemove = Resource.Annotations.OfType<TAnnotation>().ToList();
                foreach (var a in toRemove)
                {
                    Resource.Annotations.Remove(a);
                }
            }

            Resource.Annotations.Add(annotation);
            return this;
        }
    }

    // Invokes all EnvironmentCallbackAnnotation instances on the resource and resolves IValueProvider
    // values (such as EndpointReference) to strings. Replicates what Aspire's internal
    // EnvironmentVariableEvaluator does, without the dependency on Aspire's test infrastructure.
    private static async Task<Dictionary<string, string>> GetServiceDiscoveryEnvVarsAsync(ScalarResource resource)
    {
        var executionContext = new DistributedApplicationExecutionContext(
            new DistributedApplicationExecutionContextOptions(DistributedApplicationOperation.Run)
            {
                ServiceProvider = new ServiceCollection().BuildServiceProvider()
            });

        var envVars = new Dictionary<string, object>();
        var callbackContext = new EnvironmentCallbackContext(executionContext, resource, envVars);

        foreach (var annotation in resource.Annotations.OfType<EnvironmentCallbackAnnotation>())
        {
            await annotation.Callback(callbackContext);
        }

        var result = new Dictionary<string, string>();
        foreach (var (key, value) in envVars)
        {
            result[key] = value switch
            {
                string s => s,
                IValueProvider vp => await vp.GetValueAsync() ?? string.Empty,
                _ => value.ToString() ?? string.Empty
            };
        }

        return result;
    }

    // Creates a TestApiResource with http (port 5000) and https (port 5001) endpoints that have
    // AllocatedEndpoints set so EndpointReference.GetValueAsync() resolves without a live runtime.
    private static MinimalResourceBuilder<TestApiResource> BuildTestApiResource()
    {
        var apiResource = new TestApiResource(ApiResourceName);
        var httpEndpoint = new EndpointAnnotation(ProtocolType.Tcp, uriScheme: "http", name: "http", targetPort: 5000) { Port = 5000 };
        var httpsEndpoint = new EndpointAnnotation(ProtocolType.Tcp, uriScheme: "https", name: "https", targetPort: 5001) { Port = 5001 };
        httpEndpoint.AllocatedEndpoint = new AllocatedEndpoint(httpEndpoint, "localhost", 5000);
        httpsEndpoint.AllocatedEndpoint = new AllocatedEndpoint(httpsEndpoint, "localhost", 5001);
        apiResource.Annotations.Add(httpEndpoint);
        apiResource.Annotations.Add(httpsEndpoint);
        return new MinimalResourceBuilder<TestApiResource>(apiResource);
    }

    [Fact]
    public async Task WithApiReference_NoEndpointName_ExposesAllEndpointsForServiceDiscovery()
    {
        var apiBuilder = BuildTestApiResource();
        var scalarResource = new ScalarResource(ScalarResourceName);
        var scalarBuilder = new MinimalResourceBuilder<ScalarResource>(scalarResource);

        scalarBuilder.WithApiReference(apiBuilder);

        var envVars = await GetServiceDiscoveryEnvVarsAsync(scalarResource);

        // Both endpoints are injected when no endpointName is specified.
        envVars.Should().ContainKey("services__my-api__https__0")
            .WhoseValue.Should().Be("https://localhost:5001");
        envVars.Should().ContainKey("services__my-api__http__0")
            .WhoseValue.Should().Be("http://localhost:5000");
    }

    [Fact]
    public async Task WithApiReference_WithEndpointName_ExposesOnlyNamedEndpointForServiceDiscovery()
    {
        var apiBuilder = BuildTestApiResource();
        var scalarResource = new ScalarResource(ScalarResourceName);
        var scalarBuilder = new MinimalResourceBuilder<ScalarResource>(scalarResource);

        // endpointName: "https" filters service-discovery to only the https endpoint.
        scalarBuilder.WithApiReference(apiBuilder, endpointName: "https");

        var envVars = await GetServiceDiscoveryEnvVarsAsync(scalarResource);

        envVars.Should().ContainKey("services__my-api__https__0")
            .WhoseValue.Should().Be("https://localhost:5001");
        envVars.Should().NotContainKey("services__my-api__http__0");
    }

    [Fact]
    public async Task WithApiReference_FileOverload_WithEndpointName_ExposesOnlyNamedEndpoint()
    {
        // The file overload also forwards endpointName to WithReference, so the same filtering applies.
        var apiBuilder = BuildTestApiResource();
        var scalarResource = new ScalarResource(ScalarResourceName);
        var scalarBuilder = new MinimalResourceBuilder<ScalarResource>(scalarResource);

        // FileInfo path does not need to exist — no disk I/O occurs during env var resolution.
        scalarBuilder.WithApiReference(apiBuilder, new FileInfo("openapi.json"), endpointName: "https");

        var envVars = await GetServiceDiscoveryEnvVarsAsync(scalarResource);

        envVars.Should().ContainKey("services__my-api__https__0")
            .WhoseValue.Should().Be("https://localhost:5001");
        envVars.Should().NotContainKey("services__my-api__http__0");
    }

    [Fact]
    public void RemoveOtlpExporterAnnotations_RemovesOnlyOtlpAnnotations()
    {
        var scalarResource = new ScalarResource(ScalarResourceName);
        var callbackAnnotation = new EnvironmentCallbackAnnotation(_ => Task.CompletedTask);
        scalarResource.Annotations.Add(new OtlpExporterAnnotation());
        scalarResource.Annotations.Add(new OtlpExporterAnnotation { RequiredProtocol = OtlpProtocol.Grpc });
        scalarResource.Annotations.Add(callbackAnnotation);

        DistributedApplicationBuilderExtensions.RemoveOtlpExporterAnnotations(scalarResource);

        scalarResource.Annotations.OfType<OtlpExporterAnnotation>().Should().BeEmpty();
        scalarResource.Annotations.Should().Contain(callbackAnnotation);
    }
}
