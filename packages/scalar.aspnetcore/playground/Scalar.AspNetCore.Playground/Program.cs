using Scalar.AspNetCore;
using APIWeaver;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi(options =>
{
    options
        .AddSecurityScheme("Bearer", scheme =>
        {
            scheme.Type = SecuritySchemeType.OAuth2;
            scheme.Flows = new OpenApiOAuthFlows
            {
                ClientCredentials = new OpenApiOAuthFlow
                {
                    Scopes = new Dictionary<string, string>
                    {
                        { "foo", "bar" }
                    },
                    TokenUrl = new Uri("http://localhost:5000/token"),
                }
            };
        })
        .AddAuthResponse();
});
builder.Services.AddAuthentication();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options
            .WithTitle("My title")
            .WithApiKeyAuthentication("ApiKey", x => x.Token = "MyToken")
            .WithApiKeyAuthentication("ApiKey", new ApiKeyOptions
            {
                Token = "MyToken"
            });


        options.Authentication = new ScalarAuthenticationOptions
        {
            PreferredSecurityScheme = "Bearer",
            OAuth2 = new OAuth2Options
            {
                ClientId = "ClientId",
                Scopes = ["read:planets"]
            }
        };
    });
}

app.UseHttpsRedirection();

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

internal record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int) (TemperatureC / 0.5556);
}