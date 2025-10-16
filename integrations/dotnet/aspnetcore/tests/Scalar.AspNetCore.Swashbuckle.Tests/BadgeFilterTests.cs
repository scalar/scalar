using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Swashbuckle.Tests;

public class BadgeFilterTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task BadgeFilter_ShouldAddBadges()
    {
        // Arrange
        var localFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services => services.AddSwaggerGen(options => options.AddScalarFilters()));
            builder.Configure(options =>
            {
                options.UseRouting();
                options.UseEndpoints(endpoints =>
                {
                    endpoints.MapSwagger("/openapi/{documentName}.json");

                    var group = endpoints.MapGroup("/foo").WithTags("foo").WithBadge("Alpha");
                    group.MapGet("/simple", Results.NoContent);
                    group.MapGet("/complex", Results.NoContent)
                        .WithBadge("Beta", BadgePosition.Before)
                        .WithBadge("Gamma", BadgePosition.After, "#ffcc00")
                        .WithBadge("Delta", color: "#00ff00");
                });
            });
        });

        var client = localFactory.CreateClient();

        // Act
        var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        // Assert
        const string expected = """
                                {
                                  "openapi": *,
                                  "info": {
                                    "title": "Scalar.AspNetCore.Swashbuckle.Tests",
                                    "version": "1.0"
                                  },
                                  "paths": {
                                    "/foo/simple": {
                                      "get": {
                                        "tags": [
                                          "foo"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-badges": [
                                          {
                                            "name": "Alpha"
                                          }
                                        ]
                                      }
                                    },
                                    "/foo/complex": {
                                      "get": {
                                        "tags": [
                                          "foo"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-badges": [
                                          {
                                            "name": "Alpha"
                                          },
                                          {
                                            "name": "Beta",
                                            "position": "before"
                                          },
                                          {
                                            "name": "Gamma",
                                            "position": "after",
                                            "color": "#ffcc00"
                                          },
                                          {
                                            "name": "Delta",
                                            "color": "#00ff00"
                                          }
                                        ]
                                      }
                                    }
                                  },
                                *
                                }
                                """;
        content.Should().Match(expected);
    }
}