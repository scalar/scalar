using APIWeaver;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using Scalar.AspNetCore.Playground.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi(options =>
{
    // Adds api key security scheme to the api
    options.AddSecurityScheme("ApiKey", scheme =>
    {
        scheme.Type = SecuritySchemeType.ApiKey;
        scheme.In = ParameterLocation.Header;
        scheme.Name = "X-Api-Key";
    });
    // Adds 401 and 403 responses to operations
    options.AddAuthResponse();
});

// Adds api key authentication to the api
builder.Services.AddApiKeyAuthentication();

var app = builder.Build();

app.UseStaticFiles();

app.MapOpenApi();

app.MapScalarApiReference(options =>
{
    options
        .WithCdnUrl("https://cdn.jsdelivr.net/npm/@scalar/api-reference")
        .WithTitle("My title")
        .WithTheme(ScalarTheme.Mars)
        .WithFavicon("/favicon.png")
        .WithSearchHotKey("s")
        .WithDownloadButton(false)
        .WithPreferredScheme("ApiKey")
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
        .WithApiKeyAuthentication(x => x.Token = "my-api-key")
        .AddServer("https://example.com")
        .AddServer(new ScalarServer("https://example.org", "My other server"));
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