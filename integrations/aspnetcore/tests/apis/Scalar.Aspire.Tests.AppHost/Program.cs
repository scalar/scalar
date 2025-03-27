using Scalar.Aspire;

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.Scalar_AspNetCore_Tests_Api>("api").WithHttpEndpoint();

var scalar = builder.AddScalarApiReference().WithHttpEndpoint(port: 54678);

scalar.WithReference(api);

builder.Build().Run();