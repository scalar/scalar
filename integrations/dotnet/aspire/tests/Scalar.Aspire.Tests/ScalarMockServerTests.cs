using System.Net.Sockets;
using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.Aspire.Tests;

/// <summary>
/// Tests the document-source wiring for <see cref="ScalarMockServerResource" />. Each test builds the
/// resource, runs <see cref="ScalarMockServerBuilderExtensions.ConfigureEnvironment" />, and asserts on
/// the environment variables the mock server container reads at startup.
/// </summary>
public class ScalarMockServerTests
{
    private const string MockServerResourceName = "mock-server";
    private const string ApiResourceName = "my-api";

    [Fact]
    public void Options_WithDocument_SetsInlineContentExclusively()
    {
        var options = new ScalarMockServerOptions().WithDocumentUrl("https://example.com/openapi.json");

        options.WithDocument("openapi: 3.1.0");

        options.HasDocument.Should().BeTrue();
        options.DocumentContent.Should().Be("openapi: 3.1.0");
        // Switching source clears the previous one — only one source is ever active.
        options.DocumentUrl.Should().BeNull();
    }

    [Fact]
    public void Options_WithDocumentFile_ReadsFileAsInlineContentExclusively()
    {
        var path = Path.GetTempFileName();
        try
        {
            File.WriteAllText(path, "openapi: 3.1.0");

            var options = new ScalarMockServerOptions().WithDocumentUrl("https://example.com/openapi.json");

            options.WithDocumentFile(path);

            options.HasDocument.Should().BeTrue();
            // The file is read at AppHost build time and provided inline.
            options.DocumentContent.Should().Be("openapi: 3.1.0");
            // Switching source clears the previous one — only one source is ever active.
            options.DocumentUrl.Should().BeNull();
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public async Task ConfigureEnvironment_WithDocument_SetsOpenApiDocumentEnvVar()
    {
        var resource = new ScalarMockServerResource(MockServerResourceName);
        resource.Options.WithDocument("openapi: 3.1.0");

        var envVars = await ResolveEnvironmentAsync(resource);

        envVars.Should().ContainKey(EnvironmentVariables.OpenApiDocument)
            .WhoseValue.Should().Be("openapi: 3.1.0");
        envVars.Should().NotContainKey(EnvironmentVariables.OpenApiDocumentUrl);
    }

    [Fact]
    public async Task ConfigureEnvironment_WithDocumentUrl_SetsOpenApiDocumentUrlEnvVar()
    {
        var resource = new ScalarMockServerResource(MockServerResourceName);
        resource.Options.WithDocumentUrl("https://example.com/openapi.json");

        var envVars = await ResolveEnvironmentAsync(resource);

        envVars.Should().ContainKey(EnvironmentVariables.OpenApiDocumentUrl)
            .WhoseValue.Should().Be("https://example.com/openapi.json");
        envVars.Should().NotContainKey(EnvironmentVariables.OpenApiDocument);
    }

    [Fact]
    public async Task ConfigureEnvironment_WithoutDocument_Throws()
    {
        var resource = new ScalarMockServerResource(MockServerResourceName);

        var act = async () => await ResolveEnvironmentAsync(resource);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{MockServerResourceName}*");
    }

    [Fact]
    public async Task WithDocumentFrom_ResolvesReferencedEndpointIntoDocumentUrl()
    {
        var apiBuilder = BuildHttpApiResource();
        var resource = new ScalarMockServerResource(MockServerResourceName);
        var mockBuilder = new MinimalResourceBuilder<ScalarMockServerResource>(resource);

        mockBuilder.WithDocumentFrom(apiBuilder, routePattern: "/openapi/v1.json");

        var envVars = await ResolveEnvironmentAsync(resource);

        envVars.Should().ContainKey(EnvironmentVariables.OpenApiDocumentUrl)
            .WhoseValue.Should().Be("http://localhost:5000/openapi/v1.json");
    }

    [Fact]
    public void AddScalarMockServer_WithoutName_UsesDefaultResourceName()
    {
        var builder = DistributedApplication.CreateBuilder([]);

        var mock = builder.AddScalarMockServer(options => options.WithDocument("openapi: 3.1.0"));

        mock.Resource.Name.Should().Be("mock-server");
    }

    [Fact]
    public void AddScalarMockServer_WiresContainerImagePortAndHealthCheck()
    {
        var builder = DistributedApplication.CreateBuilder([]);

        var mock = builder.AddScalarMockServer("petstore", options => options.WithDocument("openapi: 3.1.0"));

        var image = mock.Resource.Annotations.OfType<ContainerImageAnnotation>().Should().ContainSingle().Subject;
        image.Image.Should().Be("scalarapi/mock-server");

        // The container listens on port 3000 internally.
        mock.Resource.Annotations.OfType<EndpointAnnotation>()
            .Should().ContainSingle(e => e.TargetPort == 3000);

        // A health check is registered so dependents can wait on the mock being ready.
        mock.Resource.Annotations.OfType<HealthCheckAnnotation>().Should().NotBeEmpty();
    }

    [Fact]
    public void WithDocumentFrom_AddsServiceDiscoveryReferenceToTarget()
    {
        var builder = DistributedApplication.CreateBuilder([]);

        var api = builder.AddResource(new TestApiResource("contract"));
        var mock = builder
            .AddScalarMockServer("contract-mock")
            .WithDocumentFrom(api, routePattern: "/openapi/v1.json");

        // The target is referenced so service discovery resolves its endpoint inside the container.
        mock.Resource.Annotations.OfType<EnvironmentCallbackAnnotation>().Should().NotBeEmpty();
    }

    // Runs ConfigureEnvironment and resolves any IValueProvider (e.g. endpoint references) to strings.
    private static async Task<Dictionary<string, string>> ResolveEnvironmentAsync(ScalarMockServerResource resource)
    {
        var executionContext = new DistributedApplicationExecutionContext(
            new DistributedApplicationExecutionContextOptions(DistributedApplicationOperation.Run)
            {
                ServiceProvider = new ServiceCollection().BuildServiceProvider()
            });

        var envVars = new Dictionary<string, object>();
        var context = new EnvironmentCallbackContext(executionContext, resource, envVars);

        ScalarMockServerBuilderExtensions.ConfigureEnvironment(resource, context);

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

    // Creates an API resource with a resolvable http endpoint (localhost:5000).
    private static MinimalResourceBuilder<TestApiResource> BuildHttpApiResource()
    {
        var apiResource = new TestApiResource(ApiResourceName);
        var httpEndpoint = new EndpointAnnotation(ProtocolType.Tcp, uriScheme: "http", name: "http", targetPort: 5000) { Port = 5000 };
        httpEndpoint.AllocatedEndpoint = new AllocatedEndpoint(httpEndpoint, "localhost", 5000);
        apiResource.Annotations.Add(httpEndpoint);
        return new MinimalResourceBuilder<TestApiResource>(apiResource);
    }

    private sealed class TestApiResource(string name) : ContainerResource(name), IResourceWithServiceDiscovery;

    // Minimal IResourceBuilder<T> that only supports annotation mutations — all WithReference/WithDocumentFrom need.
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
}
