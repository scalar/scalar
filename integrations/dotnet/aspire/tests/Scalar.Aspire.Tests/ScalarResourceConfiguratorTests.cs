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

    // Builds a minimal context and returns the deserialized API_REFERENCE_CONFIG array.
    private static async Task<JsonElement[]> GetConfigAsync(
        IResource apiResource,
        Func<ScalarOptions, CancellationToken, Task>? configureOptions = null,
        bool publishMode = false)
    {
        var scalarResource = new ScalarResource(ScalarResourceName);
        scalarResource.Annotations.Add(new ScalarAnnotation(apiResource, configureOptions));

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
        // When BaseDocumentUrl = ReferenceExpression.Empty the OpenAPI document is served
        // directly from the Scalar container, so the source URL must not be prefixed with
        // the API service URL.
        var configs = await GetConfigAsync(
            HttpApiResource(),
            (options, _) =>
            {
                options.BaseDocumentUrl = ReferenceExpression.Empty;
                options.OpenApiRoutePattern = "/openapi/spec.yaml";
                options.AddDocument("spec");
                return Task.CompletedTask;
            });

        var url = configs[0].GetProperty("sources")[0].GetProperty("url").GetString();
        url.Should().Be("openapi/spec.yaml");
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
        scalarResource.Annotations.Add(new ScalarAnnotation(HttpApiResource("api-one", 5000), null));
        scalarResource.Annotations.Add(new ScalarAnnotation(HttpApiResource("api-two", 5001), null));

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
        scalarResource.Annotations.Add(new ScalarAnnotation(HttpApiResource(), null));

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
