using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.TestUtilities;
using Microsoft.Extensions.DependencyInjection;
using Scalar.Aws.Lambda;

namespace Scalar.Aws.Lambda.Tests;

/// <summary>
/// Exercises the zero-DI static factory entry point (<see cref="ScalarApiReferenceHandler.Create" />) and
/// verifies it stays in parity with the DI-registered <see cref="IScalarApiReference" /> implementation, since
/// both share the same underlying transport logic.
/// </summary>
public class ScalarApiReferenceHandlerTests
{
    private static APIGatewayHttpApiV2ProxyRequest CreateRequest(string rawPath, string? routeRemainder, string stage = "$default") =>
        new()
        {
            RawPath = rawPath,
            Headers = new Dictionary<string, string>(),
            PathParameters = new Dictionary<string, string> { ["proxy"] = routeRemainder ?? string.Empty },
            RequestContext = new APIGatewayHttpApiV2ProxyRequest.ProxyRequestContext { Stage = stage }
        };

    [Fact]
    public async Task Create_ShouldReturnIndex_WhenIndexRequested()
    {
        var handler = ScalarApiReferenceHandler.Create();

        var response = await handler(CreateRequest("/scalar/", string.Empty), new TestLambdaContext());

        response.StatusCode.Should().Be(200);
        response.Body.Should().Contain("<div id=\"app\"></div>").And.Contain("openapi/v1.json");
    }

    [Fact]
    public async Task Create_ShouldApplyConfigureOptions()
    {
        var handler = ScalarApiReferenceHandler.Create(options => options.Title = "My API");

        var response = await handler(CreateRequest("/scalar/", string.Empty), new TestLambdaContext());

        response.Body.Should().Contain("<title>My API</title>");
    }

    [Fact]
    public async Task Create_ShouldAutoDetectStage_LikeDiEntryPoint()
    {
        var handler = ScalarApiReferenceHandler.Create();

        var response = await handler(CreateRequest("/prod/scalar/", string.Empty, "prod"), new TestLambdaContext());

        response.Body.Should().Contain("'%2Fscalar%2F'");
        response.Body.Should().NotContain("'%2Fprod%2Fscalar%2F'");
    }

    [Fact]
    public async Task Create_ShouldNotLeakDocumentState_AcrossInvocations()
    {
        // Regression test: the static factory must give each invocation a fresh ScalarOptions, otherwise a
        // document set by one request (e.g. via the route remainder) would incorrectly persist into the next.
        var handler = ScalarApiReferenceHandler.Create();

        var first = await handler(CreateRequest("/scalar/v3", "v3"), new TestLambdaContext());
        first.Body.Should().Contain("openapi/v3.json");

        var second = await handler(CreateRequest("/scalar/", string.Empty), new TestLambdaContext());
        second.Body.Should().Contain("openapi/v1.json");
        second.Body.Should().NotContain("openapi/v3.json");
    }

    [Fact]
    public async Task Create_And_Di_ShouldProduceIdenticalResponses_ForSameInput()
    {
        var services = new ServiceCollection();
        services.AddScalarApiReference(options => options.Title = "Shared config");
        await using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var diScalar = scope.ServiceProvider.GetRequiredService<IScalarApiReference>();

        var staticHandler = ScalarApiReferenceHandler.Create(options => options.Title = "Shared config");

        var request = CreateRequest("/scalar/", string.Empty);
        var context = new TestLambdaContext();

        var diResponse = await diScalar.HandleAsync(request, context);
        var staticResponse = await staticHandler(request, context);

        staticResponse.StatusCode.Should().Be(diResponse.StatusCode);
        staticResponse.Body.Should().Be(diResponse.Body);
        staticResponse.IsBase64Encoded.Should().Be(diResponse.IsBase64Encoded);
    }
}
