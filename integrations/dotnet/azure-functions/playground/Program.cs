using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.Azure.Functions;

var builder = FunctionsApplication.CreateBuilder(args);

// Enable the ASP.NET Core integration HTTP model.
builder.ConfigureFunctionsWebApplication();

// Register the Scalar API reference services.
builder.Services.AddScalarApiReference(options =>
{
    options.Title = "Scalar Azure Functions Playground";
});

builder.Build().Run();