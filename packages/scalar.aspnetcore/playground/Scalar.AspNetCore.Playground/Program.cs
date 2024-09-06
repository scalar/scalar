using APIWeaver;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using Scalar.AspNetCore.Playground.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi(options =>
{
    options.AddSecurityScheme("ApiKey", scheme =>
    {
        scheme.Type = SecuritySchemeType.ApiKey;
        scheme.In = ParameterLocation.Header;
        scheme.Name = "X-Api-Key";
    });
    options.AddAuthResponse();
});

// Adds a very simple api key authentication to the api
builder.Services.AddApiKeyAuthentication();

var app = builder.Build();

app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("My title")
        .WithTheme(ScalarTheme.Mars)
        .WithSearchHotKey("s")
        .WithSidebar(false)
        .WithDownloadButton(false)
        .WithPreferredScheme("ApiKey")
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
        .WithApiKeyAuthentication(x => x.Token = "my-api-key");
});

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast")
    .RequireAuthorization();

app.Run();

internal sealed record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int) (TemperatureC / 0.5556);
}