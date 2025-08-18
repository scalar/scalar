using Scalar.Aspire.Service.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();
builder.Services.AddHttpForwarderWithServiceDiscovery();
builder.Services.AddServiceDiscovery();

var app = builder.Build();

app.MapHealthChecks(HealthCheckEndpoint);

app.MapApiReference();
app.MapStaticAssets();

if (app.Configuration.GetValue<bool>(DefaultProxy))
{
    app.MapScalarProxy();
}

app.Run();

public partial class Program;