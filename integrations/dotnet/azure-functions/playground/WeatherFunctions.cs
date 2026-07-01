using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;

namespace Scalar.Azure.Functions.Playground;

/// <summary>
/// A tiny sample API plus the OpenAPI document that the Scalar reference renders.
/// </summary>
public class WeatherFunctions
{
    [Function("GetWeather")]
    public IActionResult GetWeather(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "weather")] HttpRequest request)
    {
        var forecast = new[]
        {
            new WeatherForecast("Berlin", 21),
            new WeatherForecast("Oslo", 7),
            new WeatherForecast("Lisbon", 28)
        };

        return new OkObjectResult(forecast);
    }

    [Function("OpenApiDocument")]
    public IActionResult GetOpenApiDocument(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "openapi/{documentName}.json")] HttpRequest request,
        string documentName)
    {
        return new ContentResult
        {
            Content = OpenApiDocument,
            ContentType = "application/json",
            StatusCode = StatusCodes.Status200OK
        };
    }

    private record WeatherForecast(string City, int TemperatureC);

    private const string OpenApiDocument =
        """
        {
          "openapi": "3.1.0",
          "info": {
            "title": "Scalar Azure Functions Playground",
            "version": "v1"
          },
          "servers": [
            { "url": "/api" }
          ],
          "paths": {
            "/weather": {
              "get": {
                "summary": "Get the weather forecast",
                "operationId": "getWeather",
                "responses": {
                  "200": {
                    "description": "A list of weather forecasts",
                    "content": {
                      "application/json": {
                        "schema": {
                          "type": "array",
                          "items": { "$ref": "#/components/schemas/WeatherForecast" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "components": {
            "schemas": {
              "WeatherForecast": {
                "type": "object",
                "properties": {
                  "city": { "type": "string" },
                  "temperatureC": { "type": "integer", "format": "int32" }
                }
              }
            }
          }
        }
        """;
}