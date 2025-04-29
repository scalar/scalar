using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Microsoft.Tests;

public class StabilityTransformerTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task StabilityTransformer_ShouldAddStabilityExtension()
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

                    var group = endpoints.MapGroup("/stability").Stable();
                    group.MapGet("/stable", Results.NoContent);
                    group.MapGet("/experimental", Results.NoContent).Experimental();
                    group.MapGet("/deprecated", Results.NoContent).Deprecated();
                });
            });
        });

        var client = localFactory.CreateClient();

        // Act
        var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        const string expected = """
                                {
                                  "openapi": *,
                                  "info": {
                                    "title": "Scalar.AspNetCore.Microsoft.Tests | v1",
                                    "version": "1.0.0"
                                  }*
                                  "paths": {
                                    "/stability/stable": {
                                      "get": {
                                        "tags": [
                                          "Results"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-scalar-stability": "stable"
                                      }
                                    },
                                    "/stability/experimental": {
                                      "get": {
                                        "tags": [
                                          "Results"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-scalar-stability": "experimental"
                                      }
                                    },
                                    "/stability/deprecated": {
                                      "get": {
                                        "tags": [
                                          "Results"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-scalar-stability": "deprecated"
                                      }
                                    }
                                  },
                                  *
                                }
                                """;
        content.Should().Match(expected);
    }
}