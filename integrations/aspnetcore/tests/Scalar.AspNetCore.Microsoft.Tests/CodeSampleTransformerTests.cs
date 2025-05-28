using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Scalar.AspNetCore.Microsoft.Tests;

public class CodeSampleTransformerTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task CodeSampleTransformer_ShouldAddCodeSamples()
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

                    var group = endpoints.MapGroup("/foo").WithTags("foo").CodeSample("const foo = 0");
                    group.MapGet("/default", Results.NoContent);
                    group.MapGet("/custom", Results.NoContent).CodeSample("const foo = 0", ScalarTarget.CSharp, "my-code");
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
                                    "/foo/default": {
                                      "get": {
                                        "tags": [
                                          "foo"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-codeSamples": [
                                          {
                                            "source": "const foo = 0"
                                          }
                                        ]
                                      }
                                    },
                                    "/foo/custom": {
                                      "get": {
                                        "tags": [
                                          "foo"
                                        ],
                                        "responses": {
                                          "200": {
                                            "description": "OK"
                                          }
                                        },
                                        "x-codeSamples": [
                                          {
                                            "source": "const foo = 0"
                                          },
                                          {
                                            "source": "const foo = 0",
                                            "lang": "csharp",
                                            "label": "my-code"
                                          }
                                        ]
                                      }
                                    }
                                  },*
                                  "tags": [
                                    {
                                      "name": "foo"
                                    }
                                  ]
                                }
                                """;
        content.Should().Match(expected);
    }
}