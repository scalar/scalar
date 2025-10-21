using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Swashbuckle.Tests;

public class ExcludeFromApiReferenceFilterTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task ExcludeFromApiReferenceTransformer_ShouldAddIgnoreExtension()
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

        const string expected = """
                                {
                                  "openapi": *,
                                  "info": {
                                    "title": "Scalar.AspNetCore.Swashbuckle.Tests",
                                    "version": "1.0"
                                  },
                                  "paths": {
                                    "/full-exclude/foo": {
                                      "get": {
                                        "tags": [
                                          "exclude"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-scalar-ignore": true
                                      }
                                    },
                                    "/full-exclude/bar": {
                                      "get": {
                                        "tags": [
                                          "exclude"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-scalar-ignore": true
                                      }
                                    },
                                    "/foo/exclude": {
                                      "get": {
                                        "tags": [
                                          "foo"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-scalar-ignore": true
                                      }
                                    },
                                    "/foo/include": {
                                      "get": {
                                        "tags": [
                                          "foo"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        }
                                      }
                                    }
                                  },
                                  *
                                }
                                """;
        content.Should().Match(expected);
    }
}