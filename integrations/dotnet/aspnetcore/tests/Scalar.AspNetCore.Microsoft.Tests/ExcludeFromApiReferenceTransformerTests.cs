using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Microsoft.Tests;

public class ExcludeFromApiReferenceTransformerTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task ExcludeFromApiReferenceTransformer_ShouldAddIgnoreExtension()
    {
        // Arrange
        var localFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services => services.AddOpenApi(options => options.AddScalarTransformers()));
            builder.Configure(options =>
            {
                options.UseRouting();
                options.UseEndpoints(endpoints =>
                {
                    endpoints.MapOpenApi();

                    var group = endpoints.MapGroup("/foo").WithTags("foo");
                    group.MapGet("/exclude", Results.NoContent).ExcludeFromApiReference();
                    group.MapGet("/include", Results.NoContent);
                    var excludeGroup = endpoints.MapGroup("/full-exclude").WithTags("exclude").ExcludeFromApiReference();
                    excludeGroup.MapGet("/foo", Results.NoContent);
                    excludeGroup.MapGet("/bar", Results.NoContent);
                });
            });
        });

        var client = localFactory.CreateClient();

        // Act
        var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Tag order can differ between generator versions.
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(content);
        var paths = document.RootElement.GetProperty("paths");
        paths.GetProperty("/foo/exclude").GetProperty("get").GetProperty("x-scalar-ignore").GetBoolean().Should().BeTrue();
        paths.GetProperty("/foo/include").GetProperty("get").TryGetProperty("x-scalar-ignore", out _).Should().BeFalse();
        paths.GetProperty("/full-exclude/foo").GetProperty("get").TryGetProperty("x-scalar-ignore", out _).Should().BeFalse();
        paths.GetProperty("/full-exclude/bar").GetProperty("get").TryGetProperty("x-scalar-ignore", out _).Should().BeFalse();

        var tags = document.RootElement.GetProperty("tags").EnumerateArray().ToDictionary(tag => tag.GetProperty("name").GetString()!);
        tags.Keys.Should().BeEquivalentTo(["foo", "exclude"]);
        tags["foo"].TryGetProperty("x-scalar-ignore", out _).Should().BeFalse();
        tags["exclude"].GetProperty("x-scalar-ignore").GetBoolean().Should().BeTrue();
    }
}