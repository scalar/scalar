var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapOpenApi("/swagger/{documentName}.json");

app.Run();