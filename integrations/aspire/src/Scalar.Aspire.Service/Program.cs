using Scalar.Aspire.Service.Endpoints;

var builder = WebApplication.CreateSlimBuilder(args);
// Required for .MapStaticAssets
builder.WebHost.UseStaticWebAssets();

builder.Services.AddHealthChecks();
builder.Services.AddHttpForwarderWithServiceDiscovery();
builder.Services.AddServiceDiscovery();

var app = builder.Build();

app.MapHealthChecks(HealthCheckEndpoint);

app.MapApiReference();
app.MapStaticAssets();

if (!string.IsNullOrEmpty(app.Configuration.GetValue<string>(DefaultProxy)))
{
    app.MapScalarProxy();
}

app.Run();

public partial class Program;