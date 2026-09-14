#if NET11_0_OR_GREATER
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace Scalar.AspNetCore.Microsoft.Tests;

public class OpenApiVersionTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData(null, "3.2.0")]
    [InlineData(OpenApiSpecVersion.OpenApi3_1, "3.1.2")]
    [InlineData(OpenApiSpecVersion.OpenApi3_2, "3.2.0")]
    public async Task ScalarTransformers_PreserveExtensionsAcrossOpenApiVersions(OpenApiSpecVersion? version, string expectedVersion)
    {
        using var localFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services => services.AddOpenApi(options =>
            {
                if (version is { } selectedVersion)
                {
                    options.OpenApiVersion = selectedVersion;
                }

                options.AddScalarTransformers();
            }));
            builder.Configure(app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapOpenApi();
                    endpoints.MapGet("/example", () => Results.Ok("Hello"))
                        .WithBadge("Beta")
                        .Experimental()
                        .CodeSample("curl /example", ScalarTarget.Shell);
                });
            });
        });

        using var client = localFactory.CreateClient();
        using var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(content);

        document.RootElement.GetProperty("openapi").GetString().Should().Be(expectedVersion);
        var operation = document.RootElement.GetProperty("paths").GetProperty("/example").GetProperty("get");
        operation.GetProperty("x-badges")[0].GetProperty("name").GetString().Should().Be("Beta");
        operation.GetProperty("x-scalar-stability").GetString().Should().Be("experimental");
        operation.GetProperty("x-codeSamples")[0].GetProperty("source").GetString().Should().Be("curl /example");
        operation.GetProperty("x-codeSamples")[0].GetProperty("lang").GetString().Should().Be("shell");
    }
}
#endif