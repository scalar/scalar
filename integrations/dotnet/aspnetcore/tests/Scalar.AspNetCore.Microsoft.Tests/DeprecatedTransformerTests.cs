using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Scalar.AspNetCore.Attributes;

namespace Scalar.AspNetCore.Microsoft.Tests;

public class DeprecatedTransformerTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task DeprecatedAttribute_ShouldBeDetectedOnEndpoint()
    {
        var localFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
                services.AddOpenApi(options => options.AddScalarTransformers()));

            builder.Configure(app =>
            {
                app.UseRouting();

                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapOpenApi();

                    endpoints.MapGet("/legacy", [Deprecated("Use /new")] () => Results.Ok());
                });
            });
        });

        var client = localFactory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        content.Should().Contain("\"deprecated\": true");
    }
}
